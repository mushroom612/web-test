import "./style.css";
import Header from "./Header";

export default function Layout({children, sectionName = "Dashboard"}) {
  return (
    <div className="layout">
      <Sidebar />
      <div className="layout-main">
        <Header sectionName={sectionName} />
        <main className="layout-content">{children}</main>
      </div>
    </div>
  );
}
