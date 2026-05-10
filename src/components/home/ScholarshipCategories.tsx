import Image from "next/image";
import { ArrowRight, GraduationCap, Sun, Users, Laptop } from "lucide-react";

const categories = [
  {
    icon: GraduationCap,
    title: "Graduate Programs",
    description: "Master's and PhD scholarships for advanced studies",
    link: "/scholarships?degree_level=Master's,PhD",
    image: "/images/categories/phd-image.jpg",
  },
  {
    icon: Sun,
    title: "Summer Programs",
    description: "Short-term funding for summer research and courses",
    link: "/scholarships?funding_type=Partial",
    image: "/images/categories/summer-prorgams.jpg",
  },
  {
    icon: Users,
    title: "Undergraduate",
    description: "Bachelor's degree funding opportunities",
    link: "/scholarships?degree_level=Bachelor's",
    image: "/images/categories/undergraduate-programs.jpg",
  },
  {
    icon: Laptop,
    title: "Online Programs",
    description: "Distance learning and remote study scholarships",
    link: "/scholarships",
    image: "/images/categories/online-programs.jpg",
  },
];

export default function ScholarshipCategories() {
  return (
    <section className="bg-gray-50 py-16 lg:py-24 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-zinc-900" style={{ fontFamily: 'Fraunces, Georgia, ui-serif, serif' }}>
            Scholarship Categories
          </h2>
          <a
            href="/scholarships"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"
          >
            View all categories
            <ArrowRight className="size-4" />
          </a>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <a
              key={category.title}
              href={category.link}
              className="group bg-white rounded-xl overflow-hidden border border-zinc-200 hover:border-brand-300 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Card Image Area */}
              <div className="relative h-48 overflow-hidden">
                {category.image ? (
                  <>
                    <Image
                      src={category.image}
                      alt={category.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </>
                ) : (
                  <div className="relative h-full bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTAgNDBMMDQgMEgwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30" />
                    <category.icon className="size-16 text-white/90 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                )}
              </div>

              {/* Card Content */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-zinc-900 mb-2 group-hover:text-brand-600 transition-colors">
                  {category.title}
                </h3>
                <p className="text-sm text-zinc-600 mb-4 line-clamp-2">
                  {category.description}
                </p>
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 group-hover:gap-3 transition-all">
                  Learn more
                  <ArrowRight className="size-4" />
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
