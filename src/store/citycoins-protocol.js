import MiamiCoin from '../images/MIA_StandAlone.svg';
import MiamiCoinBG from '../images/MIA_BG_Horizontal.svg';
import NewYorkCityCoin from '../images/NYC_StandAlone.svg';
import NewYorkCityCoinBG from '../images/NYC_BG_Horizontal.svg';
import { atom } from 'jotai';

/////////////////////////
// CITY INFO
/////////////////////////

const VERSIONS = ['legacyV1', 'legacyV2', 'daoV1'];

const MIA_INFO = {
  name: 'mia',
  displayName: 'Miami',
  symbol: 'MIA',
  logo: MiamiCoin,
  background: MiamiCoinBG,
  textColor: 'text-dark',
  versions: VERSIONS,
  currentVersion: 'daoV1',
};

const NYC_INFO = {
  name: 'nyc',
  displayName: 'New York City',
  symbol: 'NYC',
  logo: NewYorkCityCoin,
  background: NewYorkCityCoinBG,
  textColor: 'text-dark',
  versions: VERSIONS,
  currentVersion: 'daoV1',
};

const CITY_INFO = {
  mia: MIA_INFO,
  nyc: NYC_INFO,
};

/////////////////////////
// CCD003/CCD004 IDS
/////////////////////////

const userIdsAtom = atom({
  mia: {
    legacyV1: undefined,
    legacyV2: undefined,
    daoV1: undefined,
  },
  nyc: {
    legacyV1: undefined,
    legacyV2: undefined,
    daoV1: undefined,
  },
});

export const cityIdsAtom = atom({
  mia: 1,
  nyc: 2,
});

/////////////////////////
// CITY CONFIGURATIONS
/////////////////////////

// create objects for v1 and v2 tokens

const miaTokenV1 = {
  deployer: 'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27',
  contractName: 'miamicoin-token',
  activated: true,
  activationBlock: 24497,
  displayName: 'MiamiCoin',
  tokenName: 'miamicoin',
  symbol: 'MIA',
  decimals: 0,
  logo: 'https://cdn.citycoins.co/logos/miamicoin.png',
  uri: 'https://cdn.citycoins.co/metadata/miamicoin.json',
};

const miaTokenV2 = {
  deployer: 'SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R',
  contractName: 'miamicoin-token-v2',
  activated: true,
  activationBlock: 24497,
  displayName: 'MiamiCoin',
  tokenName: 'miamicoin',
  symbol: 'MIA',
  decimals: 6,
  logo: 'https://cdn.citycoins.co/logos/miamicoin.png',
  uri: 'https://cdn.citycoins.co/metadata/miamicoin.json',
};

const nycTokenV1 = {
  deployer: 'SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5',
  contractName: 'newyorkcitycoin-token',
  activated: true,
  activationBlock: 37449,
  displayName: 'NewYorkCityCoin',
  tokenName: 'newyorkcitycoin',
  symbol: 'NYC',
  decimals: 0,
  logo: 'https://cdn.citycoins.co/logos/newyorkcitycoin.png',
  uri: 'https://cdn.citycoins.co/metadata/newyorkcitycoin.json',
};

const nycTokenV2 = {
  deployer: 'SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11',
  contractName: 'newyorkcitycoin-token-v2',
  activated: true,
  activationBlock: 37449,
  displayName: 'NewYorkCityCoin',
  tokenName: 'newyorkcitycoin',
  symbol: 'NYC',
  decimals: 6,
  logo: 'https://cdn.citycoins.co/logos/newyorkcitycoin.png',
  uri: 'https://cdn.citycoins.co/metadata/newyorkcitycoin.json',
};

// create object for v1 of the DAO

const daoV1 = city => {
  const token = () => {
    switch (city) {
      case 'mia':
        return miaTokenV2;
      case 'nyc':
        return nycTokenV2;
      default:
        return undefined;
    }
  };
  return {
    mining: {
      deployer: 'SP1XQXW9JNQ1W4A7PYTN3HCHPEY7SHM6KP98H3NCY',
      contractName: 'ccd006-citycoin-mining',
      miningFunction: 'mine',
      miningClaimFunction: 'claim-mining-reward',
      activated: true,
      activationBlock: 96600, // TODO: UPDATE THIS
      shutdown: false,
      shutdownBlock: undefined,
    },
    stacking: {
      deployer: 'SP1XQXW9JNQ1W4A7PYTN3HCHPEY7SHM6KP98H3NCY',
      contractName: 'ccd007-city-stacking',
      stackingFunction: 'stack',
      stackingClaimFunction: 'claim-stacking-reward',
      startCycle: 54,
      endCycle: undefined,
    },
    token: token,
  };
};

// create object for MIA configuration

const MIA_CONFIG = {
  legacyV1: {
    mining: {
      deployer: 'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27',
      contractName: 'miamicoin-core-v1',
      miningFunction: 'mine-many',
      miningClaimFunction: 'claim-mining-reward',
      activated: false,
      activationBlock: 24497,
      shutdown: true,
      shutdownBlock: 58917,
    },
    stacking: {
      deployer: 'SP466FNC0P7JWTNM2R9T199QRZN1MYEDTAR0KP27',
      contractName: 'miamicoin-core-v1',
      stackingFunction: 'stack-tokens',
      stackingClaimFunction: 'claim-stacking-reward',
      startCycle: 1,
      endCycle: 16,
    },
    token: miaTokenV1,
  },
  legacyV2: {
    mining: {
      deployer: 'SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R',
      contractName: 'miamicoin-core-v2',
      miningFunction: 'mine-many',
      miningClaimFunction: 'claim-mining-reward',
      activated: true,
      activationBlock: 58921,
      shutdown: true,
      shutdownBlock: 96600, // TODO: UPDATE THIS
    },
    stacking: {
      deployer: 'SP1H1733V5MZ3SZ9XRW9FKYGEZT0JDGEB8Y634C7R',
      contractName: 'miamicoin-core-v2',
      stackingFunction: 'stack-tokens',
      stackingClaimFunction: 'claim-stacking-reward',
      startCycle: 17,
      endCycle: 34,
    },
    token: miaTokenV2,
  },
  daoV1: daoV1('mia'),
};

// create object for NYC configuration

const NYC_CONFIG = {
  legacyV1: {
    mining: {
      deployer: 'SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5',
      contractName: 'newyorkcitycoin-core-v1',
      miningFunction: 'mine-many',
      miningClaimFunction: 'claim-mining-reward',
      activated: true,
      activationBlock: 37449,
      shutdown: true,
      shutdownBlock: 58922,
    },
    stacking: {
      deployer: 'SP2H8PY27SEZ03MWRKS5XABZYQN17ETGQS3527SA5',
      contractName: 'newyorkcitycoin-core-v1',
      stackingFunction: 'stack-tokens',
      stackingClaimFunction: 'claim-stacking-reward',
      startCycle: 1,
      endCycle: 10,
    },
    token: nycTokenV1,
  },
  legacyV2: {
    mining: {
      deployer: 'SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11',
      contractName: 'newyorkcitycoin-core-v2',
      miningFunction: 'mine-many',
      miningClaimFunction: 'claim-mining-reward',
      activated: true,
      activationBlock: 58925,
    },
    stacking: {
      deployer: 'SPSCWDV3RKV5ZRN1FQD84YE1NQFEDJ9R1F4DYQ11',
      contractName: 'newyorkcitycoin-core-v2',
      stackingFunction: 'stack-tokens',
      stackingClaimFunction: 'claim-stacking-reward',
      startCycle: 11,
      endCycle: 28,
    },
    token: nycTokenV2,
  },
  daoV1: daoV1('nyc'),
};

// combine both city configs as one object

// key: currentCityAtom, cityInfoAtom
const CITY_CONFIG = {
  mia: MIA_CONFIG,
  nyc: NYC_CONFIG,
};

////////////////////
// VERSION HELPERS
////////////////////

// city = currentCity.data
// block = block height for mining claim
export async function getVersionByBlock(city, block) {
  for (const version of CITY_INFO[city].versions) {
    const activationBlock = CITY_CONFIG[city][version].mining.activationBlock;
    const shutdown = CITY_CONFIG[city][version].mining.shutdown;
    const shutdownBlock = shutdown ? CITY_CONFIG[city][version].mining.shutdownBlock : undefined;
    if (block < activationBlock) {
      return undefined;
    }
    if (shutdown && block <= shutdownBlock) {
      return version;
    }
    if (!shutdown) {
      return version;
    }
  }
}

// city = currentCity.data
// cycle = stacking cycle for stacking claim
export async function getVersionByCycle(city, cycle) {
  for (const version of CITY_INFO[city].versions) {
    const startCycle = CITY_CONFIG[city][version].stacking.startCycle;
    const endCycle = CITY_CONFIG[city][version].stacking.endCycle;
    if (cycle < startCycle) {
      return undefined;
    }
    if (cycle >= startCycle && endCycle === undefined) {
      return version;
    }
    if (cycle <= endCycle) {
      return version;
    }
  }
}

////////////////////
// CONFIG HELPERS
////////////////////

// city = currentCity.data
// version = getVersion* above or default to latest
export async function getCitySettings(city, version = undefined) {
  return {
    info: CITY_INFO[city],
    config: version
      ? CITY_CONFIG[city][version]
      : CITY_CONFIG[city][CITY_INFO[city].currentVersion],
  };
}

// city = currentCity.data
// version = getVersion* above or default to latest
export async function getCityConfig(city, version = undefined) {
  return version ? CITY_CONFIG[city][version] : CITY_CONFIG[city][CITY_INFO[city].currentVersion];
}

// city = currentCity.data
export async function getCityInfo(city) {
  return CITY_INFO[city];
}
