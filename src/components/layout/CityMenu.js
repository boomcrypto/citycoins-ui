import { Link } from '@reach/router';
import { useAtom } from 'jotai';
import { CHAIN_SUFFIX } from '../../lib/stacks';
import {
  CITY_INFO,
  CITY_LIST,
  CITY_ROUTES,
  currentRouteAtom,
  currentCityAtom,
  miningStatsAtom,
  stackingStatsAtom,
  currentRewardCycleAtom,
} from '../../store/cities';

export default function CityMenu({ menuName }) {
  const [currentCity, setCurrentCity] = useAtom(currentCityAtom);
  const [currentRoute, setCurrentRoute] = useAtom(currentRouteAtom);
  const [, setMiningStats] = useAtom(miningStatsAtom);
  const [, setStackingStats] = useAtom(stackingStatsAtom);
  const [, setCurrentRewardCycle] = useAtom(currentRewardCycleAtom);

  const cityMenu = CITY_LIST.map(city => {
    return (
      <li key={city} className={`nav-item me-3 ${city === currentCity ? 'nav-item-active' : ''}`}>
        <Link
          className="nav-link d-block"
          to={`/${
            currentRoute.loaded ? currentRoute.data.toLowerCase() : 'dashboard'
          }${CHAIN_SUFFIX}`}
          onClick={() => {
            setCurrentCity({ loaded: true, data: city });
            !currentRoute.loaded && setCurrentRoute({ loaded: true, data: 'dashboard' });
            setMiningStats([]);
            setStackingStats([]);
            setCurrentRewardCycle({ loaded: false, data: '' });
          }}
        >
          <img className="nav-logo me-2" src={CITY_INFO[city].logo} alt={`${city} logo`} />
          {CITY_INFO[city].name}
        </Link>
      </li>
    );
  });

  const cityMenuSmall = CITY_LIST.map(city => {
    return (
      <Link
        key={city}
        className="nav-item nav-link col text-center text-left-md"
        to={`/${
          currentRoute.loaded ? currentRoute.data.toLowerCase() : 'dashboard'
        }${CHAIN_SUFFIX}`}
        onClick={() => {
          setCurrentCity({ loaded: true, data: city });
          !currentRoute.loaded && setCurrentRoute({ loaded: true, data: 'dashboard' });
          setMiningStats([]);
          setStackingStats([]);
          setCurrentRewardCycle({ loaded: false, data: '' });
        }}
      >
        <img className="nav-logo" src={CITY_INFO[city].logo} alt={`${city} logo`} />
      </Link>
    );
  });

  const cityRoutes = CITY_ROUTES.map(value => {
    return (
      <li
        key={value}
        className={`nav-item ${value === currentRoute.data ? 'nav-item-active' : ''}`}
      >
        <Link
          className="nav-link"
          to={`/${value.toLowerCase()}${CHAIN_SUFFIX}`}
          onClick={() => setCurrentRoute({ loaded: true, data: value })}
        >
          {value}
        </Link>
      </li>
    );
  });

  if (currentCity.loaded) return <CitySelected cityMenu={cityMenuSmall} routes={cityRoutes} />;

  return <NoCitySelected menu={cityMenuSmall} />;
}

function NoCitySelected({ menu }) {
  return (
    <nav className="navbar navbar-expand-md navbar-light bg-white">
      <div className="container-fluid m-0 p-0 justify-content-center">
        <button
          className="navbar-toggler m-2"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span> Menu
        </button>
        <div
          className="collapse navbar-collapse align-items-center justify-content-center"
          id="navbarNav"
        >
          <ul className="navbar-nav align-items-center justify-content-center">
            <li className="nav-item nav-item-title">
              <span className="fs-5">Select a City</span>
            </li>
            {menu}
          </ul>
        </div>
      </div>
    </nav>
  );
}

function CitySelected({ cityMenu, routes }) {
  return (
    <nav className="navbar navbar-light bg-white">
      <div className="container-fluid m-0 p-0 flex-column-reverse flex-md-row justify-content-md-between flex-md-nowrap">
        <ul className="nav nav-pills flex-column flex-md-row flex-md-nowrap align-items-center justify-content-center">
          {routes}
        </ul>
        <div className="row flex-column flex-md-row align-self-center align-self-end-md align-items-center">
          <span className="col nav-text text-nowrap">Select a city</span>
          {cityMenu}
        </div>
      </div>
    </nav>
  );
}

/*
<Link
        key={city}
        className="nav-item nav-link col text-center text-left-md"
        to={`/${
          currentRoute.loaded ? currentRoute.data.toLowerCase() : 'dashboard'
        }${CHAIN_SUFFIX}`}
        onClick={() => {
          setCurrentCity({ loaded: true, data: city });
          !currentRoute.loaded && setCurrentRoute({ loaded: true, data: 'dashboard' });
          setMiningStats([]);
          setStackingStats([]);
          setCurrentRewardCycle({ loaded: false, data: '' });
        }}
      >
        <img className="nav-logo" src={CITY_INFO[city].logo} alt={`${city} logo`} />
      </Link>
*/
