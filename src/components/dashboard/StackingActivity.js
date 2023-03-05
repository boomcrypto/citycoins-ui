import { useAtom } from 'jotai';
import { useEffect, useMemo } from 'react';
import { getFirstStacksBlockInRewardCycle, getStackingStatsAtCycle } from '../../lib/citycoins';
import {
  CITY_INFO,
  REWARD_CYCLE_LENGTH,
  currentCityAtom,
  currentRewardCycleAtom,
  stackingStatsPerCityAtom,
} from '../../store/cities';
import { currentStacksBlockAtom } from '../../store/stacks';
import CurrentRewardCycle from '../common/CurrentRewardCycle';
import LoadingSpinner from '../common/LoadingSpinner';
import StackingStats from './StackingStats';
import ComingSoon from '../common/ComingSoon';
import { fetchJson } from '../../lib/common';
import { cityIdsAtom } from '../../store/citycoins-protocol';

export default function StackingActivity() {
  const [currentStacksBlock] = useAtom(currentStacksBlockAtom);
  const [currentRewardCycle] = useAtom(currentRewardCycleAtom);
  const [currentCity] = useAtom(currentCityAtom);
  const [cityIds] = useAtom(cityIdsAtom);
  const [stackingStatsPerCity, setStackingStatsPerCity] = useAtom(stackingStatsPerCityAtom);

  const firstProtocolCycle = 54;

  const cityStackingStats = useMemo(() => {
    if (currentCity.loaded) {
      const key = currentCity.data;
      if (stackingStatsPerCity[key]) {
        return stackingStatsPerCity[key];
      }
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
      console.log('fetchStackingStats', cycle, distance);
      // get city ID
      const cityId = cityIds[currentCity.data];
      console.log('cityId', cityId);
      /*
      const stats = await getStackingStatsAtCycle(
        CITY_INFO[currentCity.data].currentVersion,
        currentCity.data,
        cycle
      );
      */
      let stats;
      if (cycle < firstProtocolCycle) {
        stats = {
          cycle: cycle,
          reward: 'N/A',
          total: 0,
        };
      } else {
        // {"reward":null | number,"total":number}
        stats = await fetchJson(
          `https://protocol.citycoins.co/api/ccd007-citycoin-stacking/get-stacking-stats?cityId=${cityId}&cycle=${cycle}`
        );
        stats.cycle = +cycle;
      }

      /*
      const startBlock = await getFirstStacksBlockInRewardCycle(
        CITY_INFO[currentCity.data].currentVersion,
        currentCity.data,
        cycle
      );
      */
      if (cycle < firstProtocolCycle) {
        stats.startBlock = 0;
      } else {
        const startBlock = await fetchJson(
          `https://protocol.citycoins.co/api/ccd007-citycoin-stacking/get-first-block-in-reward-cycle?cityId=${cityId}&cycle=${cycle}`
        );
        stats.startBlock = +startBlock;
      }
      // need BTC block here
      const currentBlock = currentStacksBlock.data;
      /*
      stats.progress =
        startBlock > currentBlock
          ? 'Future'
          : currentBlock - startBlock < REWARD_CYCLE_LENGTH
          ? (((currentBlock - startBlock) / REWARD_CYCLE_LENGTH) * 100).toFixed(2) + '%'
          : 'Complete';
          */
      if (cycle < firstProtocolCycle) {
        stats.progress = 'N/A';
      } else {
        stats.progress = 'TBD';
      }
      console.log('stats', stats);
      setStackingStatsPerCity(prev => {
        // copy of full object
        const newStats = { ...prev };
        // copy of city object
        const newCityStats = newStats[currentCity.data];
        newCityStats.data.push(stats);
        newCityStats.data.sort((a, b) => a.cycle - b.cycle);
        console.log('distance', distance, 'newCityStats.data.length', newCityStats.data.length);
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
      for (let i = start; i <= end; i++) {
        fetchStackingStats(i, end - start + 1);
      }
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

/*

*/
