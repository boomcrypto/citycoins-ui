import { useEffect } from 'react';
import { useAtom } from 'jotai';
import { useUpdateAtom } from 'jotai/utils';
import { getUserData } from '@stacks/connect';
import { getStacksAccount } from '../../lib/account';
import { useConnect, userSessionStateAtom } from '../../lib/auth';
import { getBnsName, getStxBalance, isMainnet } from '../../lib/stacks';
import {
  loginStatusAtom,
  stxAddressAtom,
  appStxAddressAtom,
  stxBnsNameAtom,
  userBalancesAtom,
} from '../../store/stacks';
import { ProfileSmall } from '../profile/ProfileSmall';
import { CITY_INFO, currentCityAtom, userIdAtom } from '../../store/cities';
import { getCCBalance, getUserId } from '../../lib/citycoins';
import { fetchJson } from '../../lib/common';

export default function HeaderAuth() {
  const { handleOpenAuth } = useConnect();
  const [userSessionState] = useAtom(userSessionStateAtom);
  const [loginStatus] = useAtom(loginStatusAtom);
  const [currentCity] = useAtom(currentCityAtom);
  const [stxAddress, setStxAddress] = useAtom(stxAddressAtom);
  const setAppStxAddress = useUpdateAtom(appStxAddressAtom);
  const setBnsName = useUpdateAtom(stxBnsNameAtom);
  const setUserBalances = useUpdateAtom(userBalancesAtom);
  const setUserIds = useUpdateAtom(userIdAtom);

  useEffect(() => {
    const fetchUserData = async () => {
      if (loginStatus) {
        const userData = await getUserData(userSessionState);
        const stxAddress = userData.profile.stxAddress[isMainnet ? 'mainnet' : 'testnet'];
        setStxAddress({ loaded: true, data: stxAddress });
        const { appStxAddress } = getStacksAccount(userData.appPrivateKey);
        setAppStxAddress({ loaded: true, data: appStxAddress });
      } else {
        setStxAddress({ loaded: false, data: '' });
        setAppStxAddress({ loaded: false, data: '' });
      }
    };
    fetchUserData();
  }, [loginStatus, setAppStxAddress, setStxAddress, userSessionState]);

  useEffect(() => {
    const fetchBnsName = async stxAddress => {
      const bnsName = await getBnsName(stxAddress).catch(() => undefined);
      bnsName
        ? setBnsName({ loaded: true, data: bnsName })
        : setBnsName({ loaded: false, data: '' });
    };
    stxAddress.loaded && fetchBnsName(stxAddress.data);
  }, [setBnsName, stxAddress.loaded, stxAddress.data]);

  useEffect(() => {
    const fetchUserBalances = async stxAddress => {
      const stxBalance = getStxBalance(stxAddress);
      const miaBalanceV1 = getCCBalance('v1', 'mia', stxAddress);
      const miaBalanceV2 = getCCBalance('v2', 'mia', stxAddress);
      const nycBalanceV1 = getCCBalance('v1', 'nyc', stxAddress);
      const nycBalanceV2 = getCCBalance('v2', 'nyc', stxAddress);
      Promise.all([stxBalance, miaBalanceV1, miaBalanceV2, nycBalanceV1, nycBalanceV2]).then(
        values => {
          const balances = {
            stx: +values[0],
            mia: {
              v1: +values[1],
              v2: +values[2],
            },
            nyc: {
              v1: +values[3],
              v2: +values[4],
            },
          };
          setUserBalances({ loaded: true, data: balances });
        }
      );
    };
    stxAddress.loaded && fetchUserBalances(stxAddress.data);
  }, [setUserBalances, stxAddress.loaded, stxAddress.data]);

  useEffect(() => {
    const fetchUserIds = async stxAddress => {
      // get all Miami user IDs
      const miaLegacyV1 = await getUserId('v1', 'mia', stxAddress).catch(() => undefined);
      const miaLegacyV2 = await getUserId('v2', 'mia', stxAddress).catch(() => undefined);
      const miaDaoV1 = await fetchJson(
        `https://protocol.citycoins.co/api/ccd003-user-registry/get-user-id?cityId=1&user=${stxAddress}`
      ).catch(() => undefined);
      // get all NYC user IDs
      const nycLegacyV1 = await getUserId('v1', 'nyc', stxAddress).catch(() => undefined);
      const nycLegacyV2 = await getUserId('v2', 'nyc', stxAddress).catch(() => undefined);
      const nycDaoV1 = await fetchJson(
        `https://protocol.citycoins.co/api/ccd003-user-registry/get-user-id?cityId=2&user=${stxAddress}`
      ).catch(() => undefined);
      // compile info to set in atom
      const userIds = {
        mia: {
          legacyV1: miaLegacyV1,
          legacyV2: miaLegacyV2,
          daoV1: miaDaoV1,
        },
        nyc: {
          legacyV1: nycLegacyV1,
          legacyV2: nycLegacyV2,
          daoV1: nycDaoV1,
        },
      };
      setUserIds({ loaded: true, data: userIds });
    };
    stxAddress.loaded && fetchUserIds(stxAddress.data);
  }, [setUserIds, stxAddress.loaded, stxAddress.data]);

  if (loginStatus) return <ProfileSmall />;

  return (
    <button
      className={`btn btn-md ${
        currentCity.loaded
          ? 'btn-outline-' + CITY_INFO[currentCity.data].bgText
          : 'btn-outline-primary'
      }`}
      type="button"
      onClick={handleOpenAuth}
    >
      Connect Wallet
    </button>
  );
}
