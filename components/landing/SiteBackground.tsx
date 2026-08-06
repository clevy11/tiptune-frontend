/** Landing theme: fixed full-page background image with dark overlay. */
export function SiteBackground() {
  return (
    <>
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/landing/seyaa.jpg')" }}
        aria-hidden
      />
      <div className="fixed inset-0 -z-10 bg-black/90" aria-hidden />
    </>
  )
}
