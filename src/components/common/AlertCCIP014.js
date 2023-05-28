export default function AlertCCIP014() {
  return (
    <div className="container">
      <div className="alert alert-primary" role="alert">
        <h4>CCIP-014 Voting is in progress!</h4>
        <p>Quick summary about CCIP-014</p>
        <div className="row flex-column flex-md-row mb-4 mt-4">
          <div className="col text-center">
            <span className="h5">5</span>
            <br />
            <span className="text-muted">Yes Votes</span>
          </div>
          <div className="col text-center">
            <span className="h5">4,000,000</span>
            <br />
            <span className="text-muted">Yes Total</span>
          </div>
          <div className="col text-center">
            <span className="h5">0</span>
            <br />
            <span className="text-muted">No Votes</span>
          </div>
          <div className="col text-center">
            <span className="h5">0</span>
            <br />
            <span className="text-muted">No Total</span>
          </div>
        </div>
        <div className="d-grid gap-2 d-md-flex justify-content-md-evenly">
          <button type="button" className="btn btn-outline-success btn-lg">
            Vote Yes
          </button>
          <button type="button" className="btn btn-outline-danger btn-lg">
            Vote No
          </button>
        </div>
      </div>
    </div>
  );
}
