import { Router } from '@reach/router';
import { Connect } from '@stacks/connect-react';
import { useAtom, useSetAtom } from 'jotai';
import { useEffect } from 'react';
import CityMenu from './components/layout/CityMenu';
import Footer from './components/layout/Footer';
import HeaderAuth from './components/layout/HeaderAuth';
import HeaderLogo from './components/layout/HeaderLogo';
import HeaderTitle from './components/layout/HeaderTitle';
import { useConnect } from './lib/auth';
import { fetchJson, sleep } from './lib/common';
import { getBlockHeight } from './lib/stacks';
import Activation from './pages/CityActivation';
import Dashboard from './pages/CityDashboard';
import Mining from './pages/CityMining';
import Stacking from './pages/CityStacking';
import Tools from './pages/CityTools';
import Landing from './pages/Landing';
import NotFound from './pages/NotFound';
import { CITY_INFO, currentCityAtom, currentRewardCycleAtom } from './store/cities';
import { currentStacksBlockAtom } from './store/stacks';

export default function App() {
  const { authOptions } = useConnect();
  const [currentCity] = useAtom(currentCityAtom);

  return (
    <Connect authOptions={authOptions}>
      <div className="container-fluid">
        <div
          className="row align-items-center justify-content-between text-center py-3"
          style={
            currentCity.loaded
              ? {
                  backgroundSize: 'cover',
                  backgroundImage: `url(${CITY_INFO[currentCity.data].background})`,
                }
              : { backgroundImage: 'none' }
          }
        >
          <div className="col-md-3 text-md-center pb-3 pb-md-0">
            <HeaderLogo />
          </div>
          <div className="col-md-6 text-md-center pb-3 pb-md-0">
            <HeaderTitle />
          </div>
          <div className="col-md-3 text-md-end text-nowrap pb-3 pb-md-0">
            <HeaderAuth />
          </div>
        </div>
        <div className="row align-items-center">
          <div className="col">
            <CityMenu menuName="topnav" />
          </div>
        </div>
        <hr className="cc-divider" />
        <div className="row align-items-center">
          <div className="col">
            <Content />
          </div>
        </div>
        <hr className="cc-divider" />
        <div className="row align-items-center">
          <div className="col">
            <CityMenu menuName="bottomnav" />
          </div>
        </div>
      </div>
      <hr className="cc-divider" />
      <Footer />
    </Connect>
  );
}

function Content() {
  const [currentCity] = useAtom(currentCityAtom);
  const setBlockHeight = useSetAtom(currentStacksBlockAtom);
  const setRewardCycle = useSetAtom(currentRewardCycleAtom);

  useEffect(() => {
    const updatePage = async () => {
      const blockHeight = await getBlockHeight();
      setBlockHeight({
        loaded: true,
        data: +blockHeight,
      });
      if (currentCity.loaded) {
        /*
        const rewardCycle = await getRewardCycle(
          CITY_INFO[currentCity.data].currentVersion,
          currentCity.data
        );
        */
        const rewardCycle = await fetchJson(
          `https://protocol.citycoins.co/api/ccd007-citycoin-stacking/get-current-reward-cycle`
        ).catch(() => undefined);
        rewardCycle && setRewardCycle({ loaded: true, data: +rewardCycle });
      }
      await sleep(1000 * 60); // 60 seconds
    };
    updatePage();
  });

  return (
    <Router>
      <Landing path="/" exact />
      <Activation path="/activation" />
      <Dashboard path="/dashboard" />
      <Mining path="/mining" />
      <Stacking path="/stacking" />
      <Tools path="/tools" />
      <NotFound default />
    </Router>
  );
}
