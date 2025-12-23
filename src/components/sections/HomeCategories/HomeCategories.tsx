import { Carousel } from "@/components/cells"
import { CategoryCard } from "@/components/organisms"

export const categories: { id: number; name: string; handle: string; image: string }[] = [
  {
    id: 1,
    name: "Homes",
    handle: "homes",
    image: "/images/house.png",
  },
  {
    id: 2,
    name: "Cars",
    handle: "cars",
    image: "/images/car.png",
  },
  {
    id: 3,
    name: "Apparel",
    handle: "apparel",
    image: "/images/apparel.png",
  },
  {
    id: 4,
    name: "Services",
    handle: "services",
    image: "/images/service.png",
  },
  {
    id: 5,
    name: "Glow",
    handle: "glow",
    image: "/images/glow.png",
  },
]

export const HomeCategories = async ({ heading }: { heading: string }) => {
  return (
    <section className="bg-primary py-8 w-full">
      <div className="mb-6">
        <h2 className="heading-lg text-primary uppercase">{heading}</h2>
      </div>
      <Carousel
        items={categories?.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      />
    </section>
  )
}
