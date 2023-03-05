import { useMemo, useRef, useState } from 'react';
import { useConnect } from '@stacks/connect-react';
import { useAtom } from 'jotai';
import CurrentStacksBlock from '../common/CurrentStacksBlock';
import FormResponse from '../common/FormResponse';
import LoadingSpinner from '../common/LoadingSpinner';
import DocumentationLink from '../common/DocumentationLink';
import { currentStacksBlockAtom, stxAddressAtom } from '../../store/stacks';
import { CITY_CONFIG, CITY_INFO, currentCityAtom } from '../../store/cities';
import { canClaimMiningReward, isBlockWinner } from '../../lib/citycoins';
import { uintCV } from '@stacks/transactions';
import { STACKS_NETWORK } from '../../lib/stacks';
import { getCitySettings, getVersionByBlock } from '../../store/citycoins-protocol';
import { fetchJson } from '../../lib/common';

export default function ClaimMiningRewards() {
  const { doContractCall } = useConnect();
  const [stxAddress] = useAtom(stxAddressAtom);
  const [currentStacksBlock] = useAtom(currentStacksBlockAtom);
  const [currentCity] = useAtom(currentCityAtom);
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

  const blockHeightRef = useRef();

  const claimPrep = async () => {
    const block = +blockHeightRef.current.value;
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
    // stx address must be loaded
    if (!stxAddress.loaded) {
      setFormMsg({
        type: 'danger',
        hidden: false,
        text: 'Stacks address not loaded. Please try again or refresh.',
      });
      setLoading(false);
      return;
    }
    // no empty values
    if (block === '') {
      setFormMsg({
        type: 'danger',
        hidden: false,
        text: 'Please enter a block height to claim.',
      });
      setLoading(false);
      return;
    }
    // no claiming before mature
    if (block > currentStacksBlock.data - 100) {
      setFormMsg({
        type: 'danger',
        hidden: false,
        text: 'Cannot claim, the winner is not known until 100 blocks pass.',
      });
      setLoading(false);
      return;
    }
    // select version based on block height
    const cityVersion = await getVersionByBlock(currentCity.data, block);
    console.log(`version: ${cityVersion}`);
    if (!cityVersion) {
      setFormMsg({
        type: 'danger',
        hidden: false,
        text: 'Cannot find city version for block height.',
      });
      setLoading(false);
      return;
    }
    // determine if legacy or current protocol is in use
    const legacy = cityVersion.includes('legacy');
    console.log(`legacy: ${legacy}`);

    let winner = false;
    let canClaim = false;

    if (legacy) {
      // select legacy target version based on block height
      const legacyVersion = await selectCityVersion(block);
      console.log(`legacyVersion: ${legacyVersion}`);
      if (!legacyVersion) {
        setFormMsg({
          type: 'danger',
          hidden: false,
          text: 'Cannot find city legacy version for block height.',
        });
        setLoading(false);
        return;
      }
      // verify user is winner at block height
      winner = await isBlockWinner(legacyVersion, currentCity.data, block, stxAddress.data);

      // verify user can claim mining reward
      canClaim = await canClaimMiningReward(
        legacyVersion,
        currentCity.data,
        block,
        stxAddress.data
      );
    } else {
      // get city ID
      const cityIdUrl = new URL(
        'https://protocol.citycoins.co/api/ccd004-city-registry/get-city-id'
      );
      cityIdUrl.searchParams.append('cityName', currentCity.data);
      const cityIdResult = await fetchJson(cityIdUrl).catch(() => undefined);
      if (!cityIdResult) {
        setFormMsg({
          type: 'danger',
          hidden: false,
          text: 'Cannot find city ID for city.',
        });
        setLoading(false);
        return;
      }
      // call new isBlockWinner, set from object
      const blockWinnerUrl =
        'https://protocol.citycoins.co/api/ccd006-citycoin-mining/is-block-winner';
      blockWinnerUrl.searchParams.append('cityId', cityIdResult);
      blockWinnerUrl.searchParams.append('claimHeight', block);
      blockWinnerUrl.searchParams.append('user', stxAddress.data);
      const blockWinnerResult = await fetchJson(blockWinnerUrl).catch(() => undefined);
      if (!blockWinnerResult) {
        setFormMsg({
          type: 'danger',
          hidden: false,
          text: 'Cannot find block winner for city.',
        });
        setLoading(false);
        return;
      }
      winner = blockWinnerResult.winner;
      canClaim = !blockWinnerResult.claimed;
    }

    if (!winner) {
      setFormMsg({
        type: 'danger',
        hidden: false,
        text: 'Cannot claim, did not win at the selected block height.',
      });
      setLoading(false);
      return;
    }
    if (!canClaim) {
      setFormMsg({
        type: 'danger',
        hidden: false,
        text: 'Cannot claim, reward already claimed.',
      });
      setLoading(false);
      return;
    }
    setFormMsg({
      type: 'success',
      hidden: false,
      text: 'Can claim reward, sending claim transaction.',
    });
    // submit mining claim transaction
    await claimReward(cityVersion, block);
  };

  const claimReward = async (version, block) => {
    const citySettings = getCitySettings(currentCity.data, version);
    const targetBlockCV = uintCV(block);
    console.log(`claiming ${block}!`);
    console.log(citySettings.config.mining.deployer);
    console.log(citySettings.config.mining.contractName);
    console.log(citySettings.config.mining.miningClaimFunction);

    await doContractCall({
      contractAddress: citySettings.config.mining.deployer,
      contractName: citySettings.config.mining.contractName,
      functionName: citySettings.config.mining.miningClaimFunction,
      functionArgs: [targetBlockCV],
      network: STACKS_NETWORK,
      onCancel: () => {
        setLoading(false);
        setFormMsg({
          type: 'warning',
          hidden: false,
          text: 'Transaction was canceled, please try again.',
        });
      },
      onFinish: result => {
        setLoading(false);
        setFormMsg({
          type: 'success',
          hidden: false,
          text: `Claim transaction succesfully sent for block ${block.toLocaleString()}.`,
          txId: result.txId,
        });
      },
    });
  };

  const selectCityVersion = async block => {
    return CITY_INFO[currentCity.data].versions.reduce((prev, curr) => {
      const startBlock = CITY_CONFIG[currentCity.data][curr].core.startBlock;
      const shutdown = CITY_CONFIG[currentCity.data][curr].core.shutdown;
      const shutdownBlock = shutdown
        ? CITY_CONFIG[currentCity.data][curr].core.shutdownBlock
        : undefined;
      if (block < startBlock) return prev;
      if (shutdown && block < shutdownBlock) return curr;
      if (!shutdown) return curr;
      return undefined;
    }, undefined);
  };

  return (
    <div className="container-fluid px-lg-5 py-3">
      <h3>
        {`Claim ${symbol ? symbol + ' ' : ''}Mining Rewards`}{' '}
        <DocumentationLink docLink="https://docs.citycoins.co/core-protocol/mining-citycoins" />
      </h3>
      <CurrentStacksBlock />
      <p>
        The winner for a block can be queried after 100 blocks pass (~16-17hrs), and the winner can
        claim newly minted {symbol}.
      </p>
      <p>
        There is only one winner per block, and STX sent to the contract for mining are not
        returned.
      </p>
      <form>
        <div className="form-floating">
          <input
            className="form-control"
            placeholder="Block Height to Claim?"
            ref={blockHeightRef}
            id="blockHeightRef"
          />
          <label htmlFor="blockHeightRef">Block Height to Claim?</label>
        </div>
        <button className="btn btn-block btn-primary my-3" type="button" onClick={claimPrep}>
          {loading ? <LoadingSpinner text="Claim Mining Reward" /> : 'Claim Mining Reward'}
        </button>
      </form>
      <FormResponse {...formMsg} />
    </div>
  );
}
