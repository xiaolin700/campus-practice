interface PageHeaderProps {
  breadcrumb: string;
  title: string;
  subtitle?: string;
  pill?: React.ReactNode;
}

export default function PageHeader({
  breadcrumb,
  title,
  subtitle,
  pill,
}: PageHeaderProps) {
  return (
    <>
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span className="page-header-breadcrumb">{breadcrumb}</span>
            <h1 className="page-header-title">{title}</h1>
            {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
          </div>
          {pill && <div style={{ marginTop: 2 }}>{pill}</div>}
        </div>
      </div>
      <div className="page-header-divider" />
    </>
  );
}
