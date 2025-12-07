// PageLayout - Contenedor principal de página
function PageLayout({ children }: { children: React.ReactNode }) {
  return <div className="space-y-6">{children}</div>;
}

// PageHeader - Header con título y descripción
function PageHeader({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

// PageTitle
function PageTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="text-3xl font-bold tracking-tight">{children}</h1>;
}

// PageDescription
function PageDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground">{children}</p>;
}

export { PageLayout, PageHeader, PageTitle, PageDescription };
