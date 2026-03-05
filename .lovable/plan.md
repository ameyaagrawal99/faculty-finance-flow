

## Faculty Salary Calculator — Implementation Plan

### Overview
A PWA-enabled, mobile & desktop-friendly salary calculator for academic faculty, with a sidebar for settings/navigation, cloud storage via Lovable Cloud, and support for multi-scenario comparison.

---

### Page 1: Salary Calculator (Main Page)
- **Input**: Select designation (ASTP Gr-II, ASTP Gr-I, ASOP, PROF), current pay cell or basic pay, years of service
- **Output**: Full salary breakdown — Basic, DA, HRA, TA, PPF, Gratuity, Perks, Gross, CTC
- **Promotion simulation**: Button to simulate promotion — applies notional 3% increment, maps to next-higher cell in target level
- **Increment simulation**: Step through annual increments, showing pay progression
- **Truncation/No Cap**: Enforced per the pay matrix image rules (e.g., Level 10/11 truncate around row 17-19, Levels 16/16A/17 show "No Cap" from row 11+)

### Page 2: Compare Scenarios
- Side-by-side comparison of multiple faculty candidates/cases
- Each case: set designation, starting pay, years, promotion timing
- Analytics: growth chart (recharts), total earnings over N years, comparison table

### Page 3: Pay Matrix Reference
- Full pay matrix table (from the uploaded image data) displayed interactively
- Highlight truncation points and no-cap levels
- Searchable/filterable by designation and level

### Sidebar (Global Settings)
- **Increment rate**: default 3%, editable
- **DA%**: default 58%, editable
- **HRA%**: city type selector (X=10%, Y=20%, Z=30%), default Y (20%)
- **TA**: default ₹5,600/month, editable
- **PPF%**: default 12%, editable
- **Gratuity%**: default 4.81%, editable
- **Perks** (each editable):
  - Housing support: ₹4,00,000/year
  - CPDA: ₹1,50,000/year
  - Health insurance: ₹10,000/year
- **Truncation/No Cap config**: toggle per academic level which columns truncate vs no-cap
- All settings saved to cloud (Lovable Cloud / Supabase)

### Salary Calculation Logic
- **Basic Pay**: From pay matrix cell
- **DA**: Basic × DA%
- **HRA**: Basic × HRA%
- **TA**: Fixed amount (default ₹5,600)
- **Gross** = Basic + DA + HRA + TA
- **PPF** = Basic × 12%
- **Gratuity** = Basic × 4.81%
- **CTC** = Gross + PPF + Gratuity + Annual Perks (prorated monthly)

### Increment/Promotion Engine
- Annual increment: next cell = ceil(current × 1.03 / 100) × 100
- Promotion: notional increment (×1.03) → map to next-higher cell in target level
- Truncation: freeze basic at max cell, DA still applies
- No Cap: generate cells dynamically beyond table
- Pay bunching: if two employees converge, grant extra 3% increment
- PhD incentive: optional additional increment(s)

### PWA Setup
- Install vite-plugin-pwa with manifest, icons, offline support
- Mobile-optimized meta tags
- `/install` page for install prompt

### Data Model (Lovable Cloud)
- **pay_matrix** table: level, cell_number, basic_pay, cap_type
- **global_settings** table: all configurable percentages/amounts
- **calculations** table: saved salary calculations, shareable
- **scenarios** table: saved comparison scenarios

### Design
- Clean, modern UI with shadcn components
- Responsive layout: sidebar collapses on mobile
- Cards for salary breakdown, tables for pay matrix
- Charts (recharts) for growth analytics in comparison view

