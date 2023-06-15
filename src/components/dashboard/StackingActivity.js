import { useAtom } from 'jotai';
import { useEffect, useMemo } from 'react';
import {
  CITY_INFO,
  currentCityAtom,
  currentRewardCycleAtom,
  stackingStatsPerCityAtom,
} from '../../store/cities';
import { currentBitcoinBlockAtom, currentStacksBlockAtom } from '../../store/stacks';
import CurrentRewardCycle from '../common/CurrentRewardCycle';
import LoadingSpinner from '../common/LoadingSpinner';
import StackingStats from './StackingStats';
import { fetchJson } from '../../lib/common';
import { cityIdsAtom } from '../../store/citycoins-protocol';

export default function StackingActivity() {
  const [currentBitcoinBlock] = useAtom(currentBitcoinBlockAtom);
  const [currentStacksBlock] = useAtom(currentStacksBlockAtom);
  const [currentRewardCycle] = useAtom(currentRewardCycleAtom);
  const [currentCity] = useAtom(currentCityAtom);
  const [cityIds] = useAtom(cityIdsAtom);
  const [stackingStatsPerCity, setStackingStatsPerCity] = useAtom(stackingStatsPerCityAtom);

  const firstProtocolCycle = 54;

  const cityStackingStats = useMemo(() => {
    if (currentCity.loaded) {
      const key = currentCity.data;
      return stackingStatsPerCity[key];
    }
    return undefined;
  }, [currentCity.loaded, currentCity.data, stackingStatsPerCity]);

  const updateStackingStats = useMemo(() => {
    if (!currentRewardCycle.loaded) return false;
    if (cityStackingStats.updating === true) return false;
    if (cityStackingStats.lastUpdated === currentStacksBlock.data) return false;
    return true;
  }, [
    cityStackingStats.lastUpdated,
    cityStackingStats.updating,
    currentStacksBlock.data,
    currentRewardCycle.loaded,
  ]);

  useEffect(() => {
    // async getter for the data per cycle
    const fetchStackingStats = async (cycle, distance) => {
      console.log('fetching stacking stats');
      const cityId = cityIds[currentCity.data];
      const currentBlock = currentBitcoinBlock.data;
      const stats = {
        cycle,
        reward: 'N/A',
        total: 0,
        startBlock: 0,
        progress: cycle < firstProtocolCycle ? 'N/A' : 'TBD',
      };
      if (cycle >= firstProtocolCycle) {
        const statsPromise = fetchJson(
          `https://protocol.citycoins.co/api/ccd007-citycoin-stacking/get-stacking-stats?cityId=${cityId}&cycle=${cycle}`
        );
        const startBlockPromise = fetchJson(
          `https://protocol.citycoins.co/api/ccd007-citycoin-stacking/get-first-block-in-reward-cycle?cityId=${cityId}&cycle=${cycle}`
        );

        const [statsResponse, startBlockResponse] = await Promise.all([
          statsPromise,
          startBlockPromise,
        ]);

        stats.reward = statsResponse.reward;
        stats.total = statsResponse.total;
        stats.startBlock = +startBlockResponse;

        if (currentBlock === 0) {
          stats.progress = 'TBD';
        } else if (currentBlock < stats.startBlock) {
          stats.progress = 'Future';
        } else if (currentBlock <= stats.startBlock + 2100) {
          const percentage = ((currentBlock - stats.startBlock) / 2100) * 100;
          stats.progress = `${percentage.toFixed(2)}%`;
        } else {
          stats.progress = 'Complete';
        }
      }
      setStackingStatsPerCity(prev => {
        // copy of full object
        const newStats = { ...prev };
        // copy of city object
        const newCityStats = newStats[currentCity.data];
        newCityStats.data.push(stats);
        newCityStats.data.sort((a, b) => a.cycle - b.cycle);
        newCityStats.updating = distance === +newCityStats.data.length ? false : true;
        // rewrite city object in full object
        newStats[currentCity.data] = newCityStats;
        return newStats;
      });
    };
    if (updateStackingStats) {
      // check values and perform update if necessary
      const key = currentCity.data;
      const block = +currentStacksBlock.data;
      const cycle = +currentRewardCycle.data;
      const start = cycle - 2;
      const end = cycle + 2;
      // clear old values
      setStackingStatsPerCity(prev => {
        const newStats = { ...prev };
        newStats[key] = { data: [], updating: true, lastUpdated: block };
        return newStats;
      });
      // fetch + set new values
      const fetchPromises = [];
      for (let i = start; i <= end; i++) {
        fetchPromises.push(fetchStackingStats(i, end - start + 1));
      }
      Promise.all(fetchPromises);
      // interesting gpt alternative
      /*
      const cyclesToFetch = Array.from({ length: end - start + 1 }, (_, i) => start + i);
      Promise.all(cyclesToFetch.map(cycle => fetchStackingStats(cycle, cyclesToFetch.length)))
      */
    }
  }, [
    currentCity.data,
    currentRewardCycle.data,
    currentStacksBlock.data,
    setStackingStatsPerCity,
    updateStackingStats,
  ]);

  return (
    <div className="container-fluid px-lg-5 py-3">
      <h3>{`${
        currentCity.loaded ? CITY_INFO[currentCity.data].symbol.toString() + ' ' : ''
      }Stacking Activity`}</h3>
      <CurrentRewardCycle symbol={currentCity.loaded && CITY_INFO[currentCity.data].symbol} />
      {cityStackingStats.updating ? (
        <LoadingSpinner text={`Loading stacking data`} />
      ) : (
        cityStackingStats.data.map(value => (
          <StackingStats key={`stats-${value.cycle}`} stats={value} />
        ))
      )}
    </div>
  );
}
