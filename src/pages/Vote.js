import { PostConditionMode } from '@stacks/transactions';
import { STACKS_NETWORK } from '../lib/stacks';
import { useConnect } from '@stacks/connect-react';
import { principalCV } from '@stacks/transactions/dist/clarity/types/principalCV';

export default function Vote() {
  const { doContractCall } = useConnect();

  const voteOnCCIP014 = async () => {
    console.log('Executing ccip014-pox-3-v2');
    try {
      await doContractCall({
        contractAddress: 'SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH',
        contractName: 'ccd001-direct-execute',
        functionName: 'direct-execute',
        functionArgs: [principalCV('SP8A9HZ3PKST0S42VM9523Z9NV42SZ026V4K39WH.ccip014-pox-3-v2')],
        postConditionMode: PostConditionMode.Allow,
        network: STACKS_NETWORK,
        onCancel: () => console.log('Cancelled'),
        onFinish: result => console.log('Succeeded', result.txid),
      });
    } catch (err) {
      console.log('Failed', err);
    }
  };

  return (
    <div className="container">
      <p>Execute ccip014-pox-3-v2 in allow mode</p>
      <button className="btn btn-block btn-primary mb-3" type="button" onClick={voteOnCCIP014}>
        Submit Signal
      </button>
    </div>
  );
}
