import { useMemo, useRef, useState } from 'react';
import { useAtom } from 'jotai';
import { useConnect } from '@stacks/connect-react';
import {
  FungibleConditionCode,
  listCV,
  makeStandardSTXPostCondition,
  PostConditionMode,
  stringAsciiCV,
  uintCV,
} from '@stacks/transactions';
import CurrentStacksBlock from '../common/CurrentStacksBlock';
import DocumentationLink from '../common/DocumentationLink';
import FormResponse from '../common/FormResponse';
import { displayMicro, STACKS_NETWORK } from '../../lib/stacks';
import { stxAddressAtom, userBalancesAtom } from '../../store/stacks';

import { CITY_INFO, currentCityAtom, miningStatsPerCityAtom } from '../../store/cities';
import LoadingSpinner from '../common/LoadingSpinner';
import MiningStats from '../dashboard/MiningStats';

export default function MineCityCoins() {
  const { doContractCall } = useConnect();

  const [stxAddress] = useAtom(stxAddressAtom);
  const [currentCity] = useAtom(currentCityAtom);
  const [balances] = useAtom(userBalancesAtom);
  const [miningStatsPerCity] = useAtom(miningStatsPerCityAtom);

  const cityMiningStats = useMemo(() => {
    if (currentCity.loaded) {
      const key = currentCity.data;
      if (miningStatsPerCity[key]) {
        return miningStatsPerCity[key];
      }
    }
    return undefined;
  }, [currentCity.loaded, currentCity.data, miningStatsPerCity]);

  const [isDisabled, setIsDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formMsg, setFormMsg] = useState({
    type: 'light',
    hidden: true,
    text: '',
    txId: '',
  });

  const amountRef = useRef();
  const mineManyRef = useRef();
  const memoRef = useRef();
  const sameAmountForAllRef = useRef();

  const [numberOfBlocks, setNumberOfBlocks] = useState();
  const [blockAmounts, setBlockAmounts] = useState([]);
  const [buttonLabel, setButtonLabel] = useState('Mine');
  const [checked, setChecked] = useState(false);

  const symbol = useMemo(() => {
    return currentCity.loaded ? CITY_INFO[currentCity.data].symbol : undefined;
  }, [currentCity.loaded, currentCity.data]);

  const updateValue = numberOfBlocks => {
    setFormMsg({
      type: '',
      hidden: true,
      text: '',
      txId: '',
    });
    if (numberOfBlocks > 1) {
      for (let i = 1; i < numberOfBlocks + 1; i++) {
        setBlockAmounts(currentBlock => [
          ...currentBlock,
          {
            num: i,
            amount: blockAmounts.amount,
          },
        ]);
      }
      setButtonLabel(`Mine for ${numberOfBlocks} blocks`);
    } else {
      if (numberOfBlocks > 0 && !isNaN(numberOfBlocks)) {
        setButtonLabel(`Mine for ${numberOfBlocks} block`);
      } else {
        setButtonLabel('Mine');
        setFormMsg({
          type: 'danger',
          hidden: false,
          text: 'Please enter a valid number',
          txId: '',
        });
      }
    }
  };

  const canBeSubmitted = () => {
    return checked ? setIsDisabled(true) : setIsDisabled(false);
  };

  const onCheckboxClick = () => {
    setChecked(!checked);
    return canBeSubmitted();
  };

  const mineAction = async () => {
    setLoading(true);

    // remove lines below when live
    setLoading(false);
    setFormMsg({
      type: 'danger',
      hidden: false,
      text: 'Mining disabled until ccip013-activation is live',
      txId: '',
    });
    return;
    // remove lines above when live

    if (numberOfBlocks === 1 && !amountRef.current.value) {
      setLoading(false);
      setFormMsg({
        type: 'danger',
        hidden: false,
        text: 'Please enter a valid amount to mine for one block.',
        txId: '',
      });
      return;
    }
    if (numberOfBlocks > 200) {
      setLoading(false);
      setFormMsg({
        type: 'danger',
        hidden: false,
        text: 'Cannot submit for more than 200 blocks.',
        txId: '',
      });
      return;
    }
    // check if balances are loaded
    if (!balances.loaded) {
      setLoading(false);
      setFormMsg({
        type: 'danger',
        hidden: false,
        text: 'Balances not loaded. Please try again or refresh.',
      });
      return;
    }
    const feePadding = 1_000_000; // 1 STX
    let mineManyArray = [];
    let totalUstx = 0;
    for (let i = 0; i < numberOfBlocks; i++) {
      let amount = +blockAmounts[i].amount * 1_000_000;
      mineManyArray.push(uintCV(amount));
      totalUstx += amount;
    }
    const mineManyArrayCV = listCV(mineManyArray);
    const totalUstxCV = uintCV(totalUstx);
    const cityNameCV = stringAsciiCV(symbol.toLowerCase());

    if (totalUstx >= balances.stx - feePadding) {
      setLoading(false);
      setFormMsg({
        type: 'danger',
        hidden: false,
        text: `Not enough funds to cover estimated transaction fee of ${feePadding} STX.\nTotal submitted for mining: ${displayMicro(
          totalUstx,
          'STX'
        )}\nAccount balance: ${displayMicro(balances.stx, 'STX')}`,
        txId: '',
      });
    } else {
      try {
        await doContractCall({
          contractAddress: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH',
          contractName: 'ccd006-citycoin-mining',
          functionName: 'mine',
          functionArgs: [cityNameCV, mineManyArrayCV],
          postConditionMode: PostConditionMode.Deny,
          postConditions: [
            makeStandardSTXPostCondition(
              stxAddress.data,
              FungibleConditionCode.Equal,
              totalUstxCV.value
            ),
          ],
          network: STACKS_NETWORK,
          onCancel: () => {
            setLoading(false);
            setFormMsg({
              type: 'warning',
              hidden: false,
              text: 'Transaction was canceled, please try again.',
              txId: '',
            });
          },
          onFinish: result => {
            setLoading(false);
            setFormMsg({
              type: 'success',
              hidden: false,
              text: 'Mining transaction successfully sent',
              txId: result.txId,
            });
          },
        });
        setLoading(false);
      } catch (err) {
        console.log(`Error: ${err.message}`);
        setLoading(false);
        setFormMsg({
          type: 'danger',
          hidden: false,
          text: `Error: ${err.message}`,
          txId: '',
        });
      }
    }
  };

  return (
    <div className="container-fluid px-lg-5 py-3">
      <h3>
        {`Mining CityCoins `}
        <DocumentationLink docLink="https://docs.citycoins.co/core-protocol/mining-citycoins" />
      </h3>
      <CurrentStacksBlock />
      <p>
        Mining {symbol} is done by competing with other miners in a Stacks block. You can only mine
        once per block.
      </p>
      <p>
        One winner is selected randomly, weighted by how much the miner commits against the total
        committed that block.
      </p>
      {cityMiningStats.updating ? (
        <LoadingSpinner text={`Loading mining data`} />
      ) : (
        cityMiningStats.data.map(value => (
          <MiningStats key={`stats-${value.blockHeight}`} stats={value} />
        ))
      )}
      <div class="row flex-col bg-secondary rounded-3 px-3 pb-3 mt-3">
        <h3 className="mt-5">
          {`Mine ${symbol} `}
          <DocumentationLink docLink="https://docs.citycoins.co/core-protocol/mining-citycoins" />
        </h3>
        <form>
          <div className="form-floating">
            <input
              className="form-control"
              placeholder="Number of Blocks to Mine?"
              ref={mineManyRef}
              onChange={event => {
                setNumberOfBlocks(parseInt(event.target.value.trim()));
                setBlockAmounts([]);
                updateValue(parseInt(event.target.value.trim()));
              }}
              value={numberOfBlocks}
              type="number"
              id="mineMany"
            />
            <label htmlFor="mineMany">Number of Blocks to Mine?</label>
          </div>
          <br />
          <div className="row">
            <div className="col-lg">
              <div className="input-group mb-3" hidden={numberOfBlocks !== 1}>
                <input
                  type="number"
                  className="form-control"
                  ref={amountRef}
                  aria-label="Amount in STX"
                  placeholder="Amount in STX"
                  required
                  minLength="1"
                />
                <div className="input-group-append">
                  <span className="input-group-text">STX</span>
                </div>
              </div>
            </div>
            <div className="col-lg">
              <input
                ref={memoRef}
                className="form-control"
                type="text"
                placeholder="Memo (optional)"
                aria-label="Optional memo field"
                maxLength="34"
                hidden={numberOfBlocks !== 1}
              />
            </div>
          </div>

          <div className="form-check mb-3" hidden={isNaN(numberOfBlocks) || numberOfBlocks === 1}>
            <input
              ref={sameAmountForAllRef}
              className="form-check-input"
              type="checkbox"
              value=""
              id="sameAmountForAll"
            />
            <label className="form-check-label" htmlFor="sameAmountForAll">
              Use same amount for all blocks?
            </label>
          </div>
          <div className="input-group">
            <div className="row g-2 w-100">
              {blockAmounts.map(b => {
                return (
                  <div className="col-md-2 form-floating" key={b.num}>
                    <input
                      className="form-control"
                      id={`miningAmount-${b.num.toString()}`}
                      onChange={e => {
                        const amount = e.target.value;
                        setBlockAmounts(currentBlock =>
                          currentBlock.map(x =>
                            x.num === b.num || sameAmountForAllRef.current.checked
                              ? {
                                  ...x,
                                  amount,
                                }
                              : x
                          )
                        );
                      }}
                      value={b.amount}
                    />
                    <label htmlFor={`miningAmount-${b.num.toString()}`}>Block {b.num}</label>
                  </div>
                );
              })}
            </div>
          </div>
          <br />
          <div className="row">
            <div className="col-lg-3">
              <button
                className="btn btn-block btn-primary mb-3"
                type="button"
                disabled={isDisabled}
                onClick={mineAction}
              >
                <div
                  role="status"
                  className={`${
                    loading ? '' : 'd-none'
                  } spinner-border spinner-border-sm text-info align-text-top ms-1 me-2`}
                />
                {buttonLabel}
              </button>
            </div>
            <div className="col">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  value=""
                  id="flexCheckDefault"
                  onClick={onCheckboxClick}
                />
                <label className="form-check-label" htmlFor="flexCheckDefault">
                  I confirm that by participating in mining, I understand:
                  <ul>
                    {symbol !== 'MIA' && (
                      <li>the city has not claimed the protocol contribution</li>
                    )}
                    <li>
                      participation does not guarantee winning the rights to claim newly minted{' '}
                      {symbol}
                    </li>
                    <li>once STX are sent to the contract, they are not returned</li>
                  </ul>
                </label>
              </div>
            </div>
          </div>
          <FormResponse
            type={formMsg.type}
            text={formMsg.text}
            hidden={formMsg.hidden}
            txId={formMsg.txId}
          />
        </form>
      </div>
    </div>
  );
}
