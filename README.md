# Business-Website

High-converting, mobile-first exterior cleaning website with:

- Home page with trust signals and before/after visuals
- Service detail page for all core offerings
- Instant quote calculator with live pricing breakdown
- Square Appointments booking handoff page
- Contact page with text-first flow, form helper, QR code, and map

## Pages

- `index.html` - Home page
- `services.html` - Service detail sections
- `quote.html` - Instant quote calculator
- `booking.html` - Square booking integration
- `contact.html` - Contact and lead capture

## Configuration

Update the booking URL in `app.js`:

1. Find `SQUARE_BOOKING_URL`
2. Replace `REPLACE_WITH_YOUR_SQUARE_LINK` with your real Square Appointments booking slug

Example:

`https://squareup.com/appointments/book/your-real-booking-id`

## Quote Pricing Logic

Current quote rates in `app.js`:

- Roof Cleaning: $0.40/sq ft
- Fence Cleaning: $0.40/sq ft
- Gutter Cleaning: $0.40/sq ft
- Window Cleaning: $0.28/sq ft
- Pressure Washing: $0.32/sq ft

## Bonus Features Included

- Quote saving to local storage (device-based dashboard)
- Upsell suggestion in quote breakdown
- Limited-time offer popup (15% off)
- Exit intent popup trigger
- Sticky header + click-to-text floating CTA