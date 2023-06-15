import { useConnect } from '@stacks/connect-react';
import { useAtom } from 'jotai';
import { useMemo, useState } from 'react';
import { displayMicro, STACKS_NETWORK } from '../../lib/stacks';
import {
  createAssetInfo,
  makeContractFungiblePostCondition,
  makeContractSTXPostCondition,
  uintCV,
  FungibleConditionCode,
  PostConditionMode,
  stringAsciiCV,
} from '@stacks/transactions';
import { CITY_INFO, currentCityAtom, rewardCyclesToClaimAtom } from '../../store/cities';
import LinkTx from '../common/LinkTx';
import { capitalizeFirstLetter } from '../../lib/common';
import { getCitySettings } from '../../store/citycoins-protocol';

export default function StackingReward({ cycle, version, data }) {
  const { doContractCall } = useConnect();
  const [currentCity] = useAtom(currentCityAtom);
  const [, setRewardCyclesToClaim] = useAtom(rewardCyclesToClaimAtom);
  const [submitted, setSubmitted] = useState(false);
  const [txId, setTxId] = useState(undefined);

  const symbol = useMemo(() => {
    return currentCity.loaded ? CITY_INFO[currentCity.data].symbol : undefined;
  }, [currentCity.loaded, currentCity.data]);

  const claimReward = async () => {
    const citySettings = await getCitySettings(currentCity.data, version);
    const targetCycleCV = uintCV(cycle);
    const amountUstxCV = uintCV(data.stxReward);
    const amountCityCoinsCV = uintCV(data.toReturn);
    // set arguments
    const legacy = version.includes('legacy');
    const args = legacy ? [targetCycleCV] : [stringAsciiCV(citySettings.info.name), targetCycleCV];
    // set post conditions
    let postConditions = [];
    data.stxReward > 0 &&
      postConditions.push(
        makeContractSTXPostCondition(
          citySettings.config.stacking.deployer,
          citySettings.config.stacking.stackingClaimContract,
          FungibleConditionCode.Equal,
          amountUstxCV.value
        )
      );
    data.toReturn > 0 &&
      postConditions.push(
        makeContractFungiblePostCondition(
          citySettings.config.stacking.deployer,
          citySettings.config.stacking.stackingClaimContract,
          FungibleConditionCode.Equal,
          amountCityCoinsCV.value,
          createAssetInfo(
            citySettings.config.token.deployer,
            citySettings.config.token.contractName,
            citySettings.config.token.tokenName
          )
        )
      );
    // submit tx
    await doContractCall({
      contractAddress: citySettings.config.stacking.deployer,
      contractName: citySettings.config.stacking.contractName,
      functionName: citySettings.config.stacking.stackingClaimFunction,
      functionArgs: args,
      postConditionMode: PostConditionMode.Deny,
      postConditions: postConditions,
      network: STACKS_NETWORK,
      onCancel: () => {
        setSubmitted(false);
        setTxId(undefined);
      },
      onFinish: result => {
        setSubmitted(true);
        setTxId(result.txId);
      },
    });
  };

  const removeFromList = async () => {
    setRewardCyclesToClaim(prev => {
      const newClaims = { ...prev };
      delete newClaims[currentCity.data][cycle][version];
      return newClaims;
    });
  };

  return (
    <>
      <hr className="cc-divider-alt" />
      <div className="row text-nowrap text-center flex-column flex-md-row align-items-center justify-content-center">
        <div className="col">
          <div className="row flex-column flex-sm-row">
            <div className="col">
              <span className="h5">{cycle}</span>
              <br />
              <span className="text-muted">Cycle #</span>
            </div>
            <div className="col">
              <span className="h5">{capitalizeFirstLetter(version)}</span>
              <br />
              <span className="text-muted">Version</span>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="row flex-column flex-sm-row">
            <div className="col">
              <span className="h5">{displayMicro(data.stxReward)}</span>
              <br />
              <span className="text-muted">STX Reward</span>
            </div>
            <div className="col">
              <span className="h5">
                {version === 'v1' ? data.toReturn.toLocaleString() : displayMicro(data.toReturn)}
              </span>
              <br />
              <span className="text-muted">{symbol} Returned</span>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="row flex-column flex-md-row">
            <div className="col">
              {data.stxReward > 0 || data.toReturn > 0 ? (
                submitted && txId ? (
                  <>
                    <LinkTx txId={txId} />
                    <br />
                    <span className="text-muted">Claim</span>
                  </>
                ) : (
                  <button
                    className="btn btn-block btn-primary"
                    type="button"
                    onClick={claimReward}
                    disabled={submitted}
                  >
                    Claim
                  </button>
                )
              ) : (
                ''
              )}
            </div>
            <div className="col">
              <button className="btn btn-block" type="button" onClick={removeFromList}>
                <i className="bi bi-x-circle" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
