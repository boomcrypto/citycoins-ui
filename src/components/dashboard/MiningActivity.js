import { useAtom } from 'jotai';
import { useEffect, useMemo } from 'react';
import { fetchJson } from '../../lib/common';
import { CITY_INFO, currentCityAtom, miningStatsPerCityAtom } from '../../store/cities';
import { cityIdsAtom } from '../../store/citycoins-protocol';
import { currentStacksBlockAtom } from '../../store/stacks';
import CurrentStacksBlock from '../common/CurrentStacksBlock';
import LoadingSpinner from '../common/LoadingSpinner';
import MiningStats from './MiningStats';

export default function MiningActivity() {
  const [currentStacksBlock] = useAtom(currentStacksBlockAtom);
  const [currentCity] = useAtom(currentCityAtom);
  const [cityIds] = useAtom(cityIdsAtom);
  const [miningStatsPerCity, setMiningStatsPerCity] = useAtom(miningStatsPerCityAtom);

  const cityMiningStats = useMemo(() => {
    if (currentCity.loaded) {
      const key = currentCity.data;
      return miningStatsPerCity[key];
    }
    return undefined;
  }, [currentCity.loaded, currentCity.data, miningStatsPerCity]);

  const updateMiningStats = useMemo(() => {
    console.log('currentStacksBlock.loaded', currentStacksBlock.loaded);
    if (!currentStacksBlock.loaded) return false;
    console.log('cityMiningStats.updating', cityMiningStats.updating);
    if (cityMiningStats.updating === true) return false;
    console.log('cityMiningStats.lastUpdated', cityMiningStats.lastUpdated);
    if (cityMiningStats.lastUpdated === currentStacksBlock.data) return false;
    return true;
  }, [
    cityMiningStats.lastUpdated,
    cityMiningStats.updating,
    currentStacksBlock.data,
    currentStacksBlock.loaded,
  ]);

  useEffect(() => {
    // async getter for the data per block
    const fetchMiningStats = async (block, distance) => {
      console.log('fetching mining stats');
      // Fetch data for a specific block
      const statsPromise = fetchJson(
        `https://protocol.citycoins.co/api/ccd006-citycoin-mining-v2/get-mining-stats?cityId=${
          cityIds[currentCity.data]
        }&height=${block}`
      );
      const rewardPromise = fetchJson(
        `https://protocol.citycoins.co/api/ccd006-citycoin-mining-v2/get-coinbase-amount?cityId=${
          cityIds[currentCity.data]
        }&height=${block}`
      );
      const [stats, reward] = await Promise.all([statsPromise, rewardPromise]);
      stats.blockHeight = block;
      stats.rewardAmount = reward;

      console.log(`stats for block ${block}\n${JSON.stringify(stats, null, 2)}`);

      setMiningStatsPerCity(prev => {
        // copy of full object
        const newStats = { ...prev };
        // copy of city object
        const newCityStats = newStats[currentCity.data];
        newCityStats.data.push(stats);
        newCityStats.data.sort((a, b) => a.blockHeight - b.blockHeight);
        newCityStats.updating = distance === newCityStats.data.length ? false : true;
        // rewrite city object in full object
        newStats[currentCity.data] = newCityStats;
        return newStats;
      });
    };
    console.log('updateMiningStats', updateMiningStats);
    if (updateMiningStats) {
      // check values and perform update if necessary
      const key = currentCity.data;
      const block = +currentStacksBlock.data;
      const start = block - 2;
      const end = block + 2;
      // clear old values
      setMiningStatsPerCity(prev => {
        const newStats = { ...prev };
        newStats[key] = { data: [], updating: true, lastUpdated: block };
        return newStats;
      });
      // fetch + set new values
      const fetchPromises = [];
      for (let i = start; i <= end; i++) {
        fetchPromises.push(fetchMiningStats(i, end - start + 1));
      }
      Promise.all(fetchPromises);
    }
  }, [
    cityIds,
    currentCity.data,
    currentStacksBlock.data,
    setMiningStatsPerCity,
    updateMiningStats,
  ]);

  return (
    <div className="container-fluid px-lg-5 py-3">
      <h3>{`${
        currentCity.loaded ? CITY_INFO[currentCity.data].symbol.toString() + ' ' : ''
      }Mining Activity`}</h3>
      <CurrentStacksBlock />
      {cityMiningStats.updating ? (
        <LoadingSpinner text={`Loading mining data`} />
      ) : (
        cityMiningStats.data.map(value => (
          <MiningStats key={`stats-${value.blockHeight}`} stats={value} />
        ))
      )}
    </div>
  );
}

/*

*/
