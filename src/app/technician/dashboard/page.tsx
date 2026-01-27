import Link from 'next/link';

export default function TechnicianDashboard() {
  return (
    <main className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Technician Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/technician/products" className="block bg-white rounded shadow p-6 hover:shadow-lg">
          <div className="font-semibold text-lg mb-2">My Products</div>
          <div className="text-gray-600">View and manage your spare part listings.</div>
        </Link>
        <Link href="/technician/products/new" className="block bg-white rounded shadow p-6 hover:shadow-lg">
          <div className="font-semibold text-lg mb-2">Add New Product</div>
          <div className="text-gray-600">List a new spare part for sale.</div>
        </Link>
        <Link href="/technician/profile" className="block bg-white rounded shadow p-6 hover:shadow-lg">
          <div className="font-semibold text-lg mb-2">Profile</div>
          <div className="text-gray-600">Manage your profile and account settings.</div>
        </Link>
      </div>
    </main>
  );
}
