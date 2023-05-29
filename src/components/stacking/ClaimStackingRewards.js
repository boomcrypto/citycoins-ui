import { useAtom } from 'jotai';
import { RESET } from 'jotai/utils';
import { Fragment, useMemo, useRef, useState } from 'react';
import {
  getStackerAtCycle,
  getStackingRewardFromContract
} from '../../lib/citycoins';
import { fetchJson } from '../../lib/common';
import {
  CITY_INFO,
  currentCityAtom,
  currentRewardCycleAtom,
  rewardCyclesToClaimAtom,
  userIdAtom,
} from '../../store/cities';
import { cityIdsAtom, getCityInfo } from '../../store/citycoins-protocol';
import { currentStacksBlockAtom } from '../../store/stacks';
import CurrentRewardCycle from '../common/CurrentRewardCycle';
import DocumentationLink from '../common/DocumentationLink';
import FormResponse from '../common/FormResponse';
import LoadingSpinner from '../common/LoadingSpinner';
import StackingReward from './StackingReward';

export default function ClaimStackingRewards() {
  const [userIds] = useAtom(userIdAtom);
  const [cityIds] = useAtom(cityIdsAtom);
  const [currentStacksBlock] = useAtom(currentStacksBlockAtom);
  const [currentRewardCycle] = useAtom(currentRewardCycleAtom);
  const [currentCity] = useAtom(currentCityAtom);
  const [rewardCyclesToClaim, setRewardCyclesToClaim] = useAtom(rewardCyclesToClaimAtom);
  const [loading, setLoading] = useState(false);
  const [formMsg, setFormMsg] = useState({
    type: 'light',
    hidden: true,
    text: '',
    txId: '',
  });

  const symbol = useMemo(() => {
    return currentCity.loaded ? CITY_INFO[currentCity.data].symbol : undefined;
  }, [currentCity.loaded, currentCity.data]);

  const rewardCycleRef = useRef();

  const claimPrep = async () => {
    const cycle = +rewardCycleRef.current.value;
    // reset state
    setLoading(true);
    setFormMsg({
      type: 'light',
      hidden: true,
      text: '',
      txId: '',
    });
    // current stacks block must be loaded
    if (!currentStacksBlock.loaded) {
      setFormMsg({
        type: 'danger',
        hidden: false,
        text: 'Stacks block not loaded. Please try again or refresh.',
      });
      setLoading(false);
      return;
    }
    // user IDs must be loaded
    if (!userIds.loaded) {
      setFormMsg({
        type: 'danger',
        hidden: false,
        text: 'User IDs not loaded. Please try again or refresh.',
      });
      setLoading(false);
      return;
    }
    // current reward cycle must be loaded
    if (!currentRewardCycle.loaded) {
      setFormMsg({
        type: 'danger',
        hidden: false,
        text: 'Reward cycle not loaded. Please try again or refresh.',
      });
      setLoading(false);
      return;
    }
    // no empty values
    if (cycle === '') {
      setFormMsg({
        type: 'danger',
        hidden: false,
        text: 'Please enter a reward cycle to claim.',
      });
      setLoading(false);
      return;
    }
    // warn if claiming during/after current cycle
    if (cycle >= currentRewardCycle.data) {
      setFormMsg({
        type: 'warning',
        hidden: false,
        text: `Reward cycle is in the future. Rewards will show 0 for the current version of the contract.`,
      });
    }
    const cityInfo = await getCityInfo(currentCity.data);
    for (const version of cityInfo.versions) {
      console.log('version', version);
      // create an array used for display
      let stxReward = 0;
      let toReturn = 0;

      ({ stxReward, toReturn } = await getClaimAmounts(cycle, version).catch(err => {
        setFormMsg({
          type: 'warning',
          hidden: false,
          text: `Unable to fetch claim amounts, please try again`,
          txId: '',
        });
      }));
      setRewardCyclesToClaim(prev => {
        // create object with original values
        const oldClaims = { ...prev };
        // check that all object keys exist in case the object is blank
        if (!oldClaims.hasOwnProperty(currentCity.data)) oldClaims[currentCity.data] = {};
        if (!oldClaims[currentCity.data].hasOwnProperty(cycle))
          oldClaims[currentCity.data][cycle] = {};
        if (!oldClaims[currentCity.data][cycle].hasOwnProperty(version))
          oldClaims[currentCity.data][cycle][version] = {};
        // delete value for same cycle if it exists
        delete oldClaims[currentCity.data][cycle][version];
        // add new value returned from getClaimAmounts
        const newClaims = { ...oldClaims };
        newClaims[currentCity.data][cycle][version] = {
          stxReward: stxReward,
          toReturn: toReturn,
        };
        return newClaims;
      });
    }
    setLoading(false);
  };

  const getClaimAmounts = async (cycle, version) => {
    let stxReward = 0;
    let toReturn = 0;
    // check if ID is found with version
    const id = userIds.data[currentCity.data][version] ?? undefined;
    console.log('id', id);
    if (id) {
      const legacy = version.includes('legacy');
      if (legacy) {
        const getLegacyVersion = () => {
          if (version === 'legacyV1') return 'v1';
          if (version === 'legacyV2') return 'v2';
          return undefined;
        };
        console.log('legacy', getLegacyVersion());
        // get reward amount
        stxReward =
          (await getStackingRewardFromContract(version, currentCity.data, cycle, id)) ?? 0;
        console.log('stxReward', stxReward);
        // get CityCoins to return
        const stacker = await getStackerAtCycle(getLegacyVersion(), currentCity.data, cycle, id);
        toReturn = stacker.toReturn ?? 0;
      } else {
        // get reward amount
        stxReward = await fetchJson(
          `https://protocol.citycoins.co/api/ccd007-citycoin-stacking/get-stacking-reward?cityId=${
            cityIds[currentCity.data]
          }&userId=${id}&cycle=${cycle}`
        ).catch(() => 0);
        // get CityCoins to return
        const stacker = await fetchJson(
          `https://protocol.citycoins.co/api/ccd007-citycoin-stacking/get-stacker?cityId=${
            cityIds[currentCity.data]
          }&userId=${id}&cycle=${cycle}`
        ).catch(() => {
          return {
            stacked: 0,
            claimable: 0,
          };
        });
        toReturn = stacker.claimable;
      }
    }

    console.log('cycle', cycle);
    console.log('stxReward', stxReward);
    console.log('toReturn', toReturn);

    return { stxReward: stxReward, toReturn: toReturn };
  };

  return (
    <div className="container-fluid px-lg-5 py-3">
      <h3>
        {`Claim ${symbol ? symbol + ' ' : ''}Stacking Rewards`}{' '}
        <DocumentationLink docLink="https://docs.citycoins.co/core-protocol/stacking-citycoins" />
      </h3>
      <CurrentRewardCycle />
      <p>
        When a reward cycle is complete, Stackers can claim their portion of the STX committed by
        miners.
      </p>
      <p>
        When the last selected cycle is complete, Stackers can claim their {symbol} back in the same
        transaction.
      </p>
      <form>
        <div className="form-floating mb-3">
          <input
            className="form-control"
            placeholder="Check Reward Cycle"
            ref={rewardCycleRef}
            id="rewardCycleRef"
          />
          <label htmlFor="rewardCycleRef">Reward Cycle to Check?</label>
        </div>
        <div className="d-flex flex-column flex-md-row align-items-center">
          <button
            className="btn btn-block btn-primary mb-3 me-md-3"
            type="button"
            onClick={claimPrep}
          >
            {loading ? <LoadingSpinner text="Check Reward Cycle" /> : 'Check Reward Cycle'}
          </button>
          <button
            className="btn btn-block btn-primary mb-3"
            type="button"
            onClick={() => setRewardCyclesToClaim(RESET)}
          >
            Clear Data
          </button>
        </div>
      </form>
      <FormResponse {...formMsg} />
      {rewardCyclesToClaim[currentCity.data] &&
        Object.values(rewardCyclesToClaim[currentCity.data]).map((cycleData, cycleIndex) => {
          return Object.values(cycleData).map((versionData, versionIndex) => {
            const cycle = Object.keys(rewardCyclesToClaim[currentCity.data])[cycleIndex];
            const version = Object.keys(cycleData)[versionIndex];
            return (
              <Fragment key={`${currentCity.data}-${cycle}-${version}`}>
                <StackingReward version={version} cycle={cycle} data={versionData} />
              </Fragment>
            );
          });
        })}
    </div>
  );
}

/* FOR LATER?

const checkAllVersionsRef = useRef();

<div className="form-check mb-3 ms-3 form-disabled">
  <input
    ref={checkAllVersionsRef}
    className="form-check-input"
    type="checkbox"
    value=""
    id="checkAllVersions"
  />
  <label className="form-check-label" htmlFor="checkAllVersions">
    Check all versions?
  </label>
</div>

*/
