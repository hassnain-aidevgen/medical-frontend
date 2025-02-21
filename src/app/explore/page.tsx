// "use client"

// import { useState } from "react"
// import Link from "next/link"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input";  // ✅ Correct path
// import { BioCard } from "@/components/BioCard"; // ✅ Correct path


// // Sample data for demonstration
// const bios = [
//   {
//     id: 1,
//     name: "Ada Lovelace",
//     role: "Mathematician and Writer",
//     bio: "Widely regarded as the first computer programmer, known for her work on Charles Babbage's proposed mechanical general-purpose computer, the Analytical Engine.",
//     imageUrl: "/placeholder.svg?height=60&width=60",
//   },
//   {
//     id: 2,
//     name: "Alan Turing",
//     role: "Computer Scientist and Cryptanalyst",
//     bio: "Pioneering computer scientist who formalized the concepts of algorithm and computation with the Turing machine, playing a pivotal role in the development of theoretical computer science.",
//     imageUrl: "/placeholder.svg?height=60&width=60",
//   },
//   {
//     id: 3,
//     name: "Grace Hopper",
//     role: "Computer Scientist and US Navy Rear Admiral",
//     bio: "One of the first programmers of the Harvard Mark I computer and invented the first compiler for a computer programming language.",
//     imageUrl: "/placeholder.svg?height=60&width=60",
//   },
//   {
//     id: 4,
//     name: "Tim Berners-Lee",
//     role: "Computer Scientist and Web Inventor",
//     bio: "Best known as the inventor of the World Wide Web. He is a Professorial Fellow of Computer Science at the University of Oxford and a professor at the Massachusetts Institute of Technology.",
//     imageUrl: "/placeholder.svg?height=60&width=60",
//   },
// ]

// export default function ExplorePage() {
//   const [searchTerm, setSearchTerm] = useState("")

//   const filteredBios = bios.filter(
//     (bio) =>
//       bio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       bio.role.toLowerCase().includes(searchTerm.toLowerCase()),
//   )

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <h1 className="text-4xl font-bold mb-6">Explore Biographies</h1>
//       <div className="mb-6">
//         <Input
//           type="text"
//           placeholder="Search by name or role..."
//           value={searchTerm}
//           onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}

//           className="max-w-sm"
//         />
//       </div>
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
//         {filteredBios.map((bio) => (
//           <BioCard key={bio.id} {...bio} />
//         ))}
//       </div>
//       {filteredBios.length === 0 && (
//         <p className="text-center text-muted-foreground">No biographies found matching your search.</p>
//       )}
//       <div className="mt-8">
//         <Link href="/landing">
//           <Button variant="outline">Back to Landing Page</Button>
//         </Link>
//       </div>
//     </div>
//   )
// }

