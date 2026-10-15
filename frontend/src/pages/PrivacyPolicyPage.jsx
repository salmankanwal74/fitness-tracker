import { useNavigate, Link } from 'react-router-dom';

function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="legal-wrap">
      <div className="legal-page">
        <button type="button" className="legal-back" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1>Privacy Policy</h1>
        <p className="legal-updated">Last updated: 10 October 2026</p>

        <p>
          Fitness Tracker helps you record your workouts, nutrition and body progress. This page
          explains what information we keep, why we keep it, and the control you have over it.
        </p>

        <h2>1. Information we store</h2>
        <ul>
          <li>
            <strong>Account:</strong> your name, username, email address and password. The password
            is stored only in hashed form, never as plain text. A profile picture is optional.
          </li>
          <li>
            <strong>Fitness data you enter:</strong> workouts, meals and nutrition values, weight,
            body measurements, performance records, goals and reminder times.
          </li>
          <li>
            <strong>Preferences:</strong> theme, units (kg/lbs, cm/in) and notification choices.
          </li>
          <li>
            <strong>Notifications and support messages:</strong> alerts generated for you and any
            message you send through the Help &amp; Support page.
          </li>
          <li>
            <strong>Consent record:</strong> the date you accepted these terms and which version.
          </li>
        </ul>

        <h2>2. Why we use it</h2>
        <p>
          Only to run the app for you: to show your progress and charts, send in-app notifications
          and reminders, let you sign in securely, reply to support requests, and email a password
          reset link when you ask for one. We do not use your data for advertising and we do not
          sell it.
        </p>

        <h2>3. Sharing</h2>
        <p>
          Your data is not shared with other users or with third parties. The one exception is the
          email service used to deliver password reset emails, which receives your email address for
          that purpose only.
        </p>

        <h2>4. Browser storage</h2>
        <p>
          The app stores your login token and display preferences in your browser&apos;s local
          storage. This is needed for you to stay signed in. We do not use advertising or tracking
          cookies.
        </p>

        <h2>5. How long we keep it</h2>
        <p>
          We keep your data while your account exists. Notifications are removed automatically after
          90 days. When you delete your account, your profile and all your fitness data, goals,
          notifications and support tickets are deleted permanently.
        </p>

        <h2>6. Your rights</h2>
        <ul>
          <li>
            <strong>Access and portability:</strong> download all your data from Profile → Your Data
            &amp; Privacy.
          </li>
          <li>
            <strong>Correction:</strong> edit your details on the Profile page, and edit or delete
            any entry you logged.
          </li>
          <li>
            <strong>Erasure and withdrawing consent:</strong> use Profile → Delete Account. This
            removes your data.
          </li>
          <li>
            <strong>Questions or complaints:</strong> contact us through the Help &amp; Support page.
            You may also complain to your local data protection authority.
          </li>
        </ul>

        <h2>7. Security</h2>
        <p>
          Passwords are hashed, access to your data requires you to be signed in, and each account
          can only see its own data. No online service can promise perfect security, so please use a
          strong, unique password.
        </p>

        <h2>8. Children</h2>
        <p>The app is not intended for children under 16.</p>

        <h2>9. Changes</h2>
        <p>
          If we change this policy we will update the date above. Please read our{' '}
          <Link to="/terms">Terms of Service</Link> as well.
        </p>
      </div>
    </div>
  );
}

export default PrivacyPolicyPage;