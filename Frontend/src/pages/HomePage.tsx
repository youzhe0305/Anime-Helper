import HomeComponent from "@/components/HomeComponent";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      <div className="text-2xl font-bold my-5">Welcome to Anime Search</div>
      <div className="flex flex-col m-5 items-center">
        <HomeComponent />
      </div>
    </div>
  )
}
