const WelcomeScreen = ({ onEnter }) => (
  <main className="welcome">
    <div className="welcome__card">
      <h1>welcome to my cat bartender!</h1>
      <button type="button" onClick={onEnter}>
        enter
      </button>
    </div>
  </main>
);

export default WelcomeScreen;
