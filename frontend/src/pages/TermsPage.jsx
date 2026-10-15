import { useNavigate, Link } from 'react-router-dom';

function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="legal-wrap">
      <div className="legal-page">
        <button type="button" className="legal-back" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1>Terms of Service</h1>
        <p className="legal-updated">Last updated: 10 October 2026</p>

        <h2>1. Using the app</h2>
        <p>
          By creating an account you agree to these terms and to our{' '}
          <Link to="/privacy">Privacy Policy</Link>. You must give correct information and keep
          your password private. You are responsible for activity on your account.
        </p>

        <h2>2. Not medical advice</h2>
        <p>
          Fitness Tracker is a logging and progress tool. Calorie estimates, goal suggestions and
          other figures are approximate and are not medical or nutritional advice. Talk to a
          qualified professional before starting a new exercise or diet plan, especially if you have
          a health condition.
        </p>

        <h2>3. Acceptable use</h2>
        <ul>
          <li>Do not try to access other users&apos; data or break the security of the app.</li>
          <li>Do not upload unlawful, harmful or offensive content.</li>
          <li>Do not misuse the support form or overload the service.</li>
        </ul>

        <h2>4. Your content</h2>
        <p>
          The data you enter belongs to you. You allow the app to store and process it only to
          provide the features described in the Privacy Policy.
        </p>

        <h2>5. Availability</h2>
        <p>
          We aim to keep the app running but it is provided &quot;as is&quot; without a guarantee of
          uninterrupted service. Planned maintenance will be announced where possible. Please
          export your data from time to time if it is important to you.
        </p>

        <h2>6. Ending your account</h2>
        <p>
          You can delete your account at any time from the Profile page. We may suspend accounts that
          break these terms.
        </p>

        <h2>7. Limits of responsibility</h2>
        <p>
          To the extent allowed by law, we are not liable for losses that result from using the app
          or relying on its figures.
        </p>

        <h2>8. Changes</h2>
        <p>
          We may update these terms. The date above shows the latest version. Continuing to use the
          app after a change means you accept it.
        </p>
      </div>
    </div>
  );
}

export default TermsPage;
