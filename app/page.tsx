import HeroSection from '@/components/home/HeroSection'
import ProblemSection from '@/components/home/ProblemSection'
import PrimitivesSection from '@/components/home/PrimitivesSection'
import StackSection from '@/components/home/StackSection'
import SovelaSection from '@/components/home/SovelaSection'
//import ZVNSection from '@/components/home/ZVNSection'
import CTASection from '@/components/home/CTASection'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ProblemSection />
      <PrimitivesSection />
      <StackSection />
      <SovelaSection />
      {/* <ZVNSection /> */}
      <CTASection />
    </>
  )
}