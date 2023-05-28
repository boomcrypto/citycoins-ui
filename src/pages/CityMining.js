import { useAtom } from 'jotai';
import MineCityCoins from '../components/mining/MineCityCoins';
import ClaimMiningRewards from '../components/mining/ClaimMiningRewards';
import Unauthorized from '../components/common/Unauthorized';
import { loginStatusAtom } from '../store/stacks';
import NoCitySelected from '../components/common/NoCitySelected';
import { currentCityAtom } from '../store/cities';
import AlertCCIP014 from '../components/common/AlertCCIP014';

export default function CityMining() {
  const [loginStatus] = useAtom(loginStatusAtom);
  const [currentCity] = useAtom(currentCityAtom);

  return !currentCity.loaded ? (
    <NoCitySelected />
  ) : loginStatus ? (
    <>
      <AlertCCIP014 />
      <MineCityCoins />
      <hr className="cc-divider" />
      <ClaimMiningRewards />
    </>
  ) : (
    <Unauthorized />
  );
}

// STATES
// auth contract not initialized
// core contract registration active
// core contract activation delay
// core contract activated

// INFO
// current block
// stx balance
// cc balance
// city balance (selected)
// mining stats atom? filter to current/next block?

// MINING
// user: already mining?
// city claimed contribution (CITY_INFO?)

// MINING CLAIM
// enter blockheight, chooses contract

// Eventually... find unclaimed blocks in both contracts. Add buttons.

// + Docs links
