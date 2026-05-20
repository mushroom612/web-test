import { Outlet } from 'react-router-dom';
import { Aside } from '../components/Aside';
import { Topbar } from '../components/Topbar';
import styles from './AdminLayout.module.css';

export function AdminLayout() {
  return (
    <div className={styles.container}>
      <Aside />
      <div className={styles.mainArea}>
        <Topbar />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
//ver o que é outlet
