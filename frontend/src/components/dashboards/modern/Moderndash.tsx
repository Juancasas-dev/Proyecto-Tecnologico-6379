import ProfileWelcome from './ProfileWelcome'
import { TopCards } from './TopCards'
import { RevenueUpdate } from './RevenueUpdate'
import { YearlyBreakup } from './YearlyBreakup'
import { MonthlyEarning } from './MonthlyEarning'
import { RecentTransaction } from './RecentTransaction'
import { ProductPerformance } from './ProductPerformance'
import { Footer } from './Footer'

const Moderndash = () => {
  return (
    <div className="grid grid-cols-12 gap-6 p-6">
      <div className="col-span-12">
        <ProfileWelcome />
      </div>
      <div className="col-span-12">
        <TopCards />
      </div>
      <div className="lg:col-span-8 col-span-12 flex">
        <ProductPerformance />
      </div>
      <div className="lg:col-span-8 col-span-12 flex">
        <RevenueUpdate />
      </div>
      <div className="lg:col-span-4 col-span-12">
        <YearlyBreakup />
        <MonthlyEarning />
      </div>
      <div className="lg:col-span-4 col-span-12">
        <RecentTransaction />
      </div>
      <div className="col-span-12">
        <Footer />
      </div>
    </div>
  )
}

export default Moderndash