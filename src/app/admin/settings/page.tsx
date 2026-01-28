export default function AdminSettingsPage() {
  return (
    <main className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
        <p className="text-gray-600">
          Settings management is handled via environment configuration and
          internal policies. Contact the engineering team for updates to
          platform-wide settings.
        </p>
      </div>
    </main>
  );
}
