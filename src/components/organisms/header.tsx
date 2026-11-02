import styles from './header.module.css';

export function MainHeader() {
  return (
    <header className={styles.header}>
      <h1 className={styles.title}>Digimon Partner Kit</h1>
      <p className={styles.intro}>
        Build your own Digimon-Partner Digivolution line.
        <br />
        <em>Select your first Digimon and then select the next/previous Levels.</em>
        <br />
        <em>
          <small>(Recommendation: Select Child level first, if you don&#39;t know where to start)</small>
        </em>
      </p>
    </header>
  );
}
