import ComingSoon from '../common/ComingSoon';
import DocumentationLink from '../common/DocumentationLink';

export default function RegisterUser() {
  return (
    <div className="container-fluid px-lg-5 py-3">
      <h3>
        {`Register User `}
        <DocumentationLink docLink="https://docs.citycoins.co/core-protocol/registration-and-activation" />
      </h3>
      <ComingSoon />
    </div>
  );
}
