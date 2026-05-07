import Link from "next/link"

export default function AdminLink() {
  return (
    <div className="text-center py-2 bg-gray-100">
      <Link href="/admin" className="text-xs text-gray-500 hover:text-gray-700">
        admin
      </Link>
    </div>
  )
}
