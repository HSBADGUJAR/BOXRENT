import SiteNavbar from "@/components/SiteNavbar";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteNavbar />
      {children}
    </>
  );
}