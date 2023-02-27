import { useAtom } from 'jotai';
import ComingSoon from '../components/common/ComingSoon';
import NoCitySelected from '../components/common/NoCitySelected';
import Unauthorized from '../components/common/Unauthorized';
import { currentCityAtom } from '../store/cities';
import { loginStatusAtom } from '../store/stacks';
import { getVersionByBlock, getVersionByCycle } from '../store/citycoins-protocol';

export default function CityTools() {
  const [loginStatus] = useAtom(loginStatusAtom);
  const [currentCity] = useAtom(currentCityAtom);

  return !currentCity.loaded ? (
    <NoCitySelected />
  ) : loginStatus ? (
    <div className="container-fluid px-lg-5 py-3">
      <h3>Tools</h3>
      <ComingSoon />
    </div>
  ) : (
    <Unauthorized />
  );
}

const testVersionsByBlock = async () => {
  const blockTests = [
    23000, 25000, 58900, 58920, 59000, 75000, 85000, 96599, 96600, 96601, 97000, 98000,
  ];
  for (const block of blockTests) {
    const version = await getVersionByBlock('mia', block);
    console.log(`claiming block ${block} uses version ${version}`);
  }
};

const testVersionsByCycle = async () => {
  const cycleTests = [0, 1, 2, 7, 16, 17, 18, 25, 33, 34, 35, 53, 54, 55, 75, 100];

  for (const cycle of cycleTests) {
    const version = await getVersionByCycle('mia', cycle);
    console.log(`cycle ${cycle} uses version ${version}`);
  }
};

/*
<br />
<br />
<button onClick={testVersionsByBlock}>test versions by block</button>
<br />
<br />
<button onClick={testVersionsByCycle}>test versions by cycle</button>
*/
