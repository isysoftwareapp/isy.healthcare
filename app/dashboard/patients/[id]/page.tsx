import dbConnect from "@/lib/mongodb";
import Patient from "@/models/Patient";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

function formatDate(date?: string | Date) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function PatientDetailPage({ params }: Props) {
  const { id } = await params;

  await dbConnect();

  const patient = await Patient.findById(id)
    .select("-passportScan")
    .populate("primaryClinic", "name");

  if (!patient) return notFound();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-sm text-gray-500">{patient.patientId}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <aside className="rounded-lg bg-white p-4 shadow">
            {patient.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={patient.photo}
                alt={`${patient.firstName} ${patient.lastName}`}
                className="w-full rounded-md object-cover"
              />
            ) : (
              <div className="flex h-40 items-center justify-center rounded-md bg-gray-100">
                <span className="text-gray-400">No photo</span>
              </div>
            )}

            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <div>
                <strong>Primary clinic:</strong>
                <div>{patient.primaryClinic?.name ?? "-"}</div>
              </div>
              <div>
                <strong>Registered:</strong>
                <div>{formatDate(patient.createdAt)}</div>
              </div>
              <div>
                <strong>Status:</strong>
                <div>{patient.isActive ? "Active" : "Inactive"}</div>
              </div>
            </div>
          </aside>

          <div className="col-span-2 space-y-6">
            <section className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Basic Info
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <p className="text-xs text-gray-500">Full name</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {patient.firstName} {patient.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date of birth</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {patient.dateOfBirth
                      ? formatDate(patient.dateOfBirth)
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Age / Gender</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {patient.age ?? "-"} years · {patient.gender ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Contact</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {patient.phoneNumber ?? "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="mt-1 font-medium text-gray-900">
                    {patient.email ?? "-"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Address
              </h2>
              <div className="text-sm text-gray-700">
                <p className="font-medium text-gray-900">
                  {patient.address?.street ?? ""}
                </p>
                <p>
                  {[patient.address?.city, patient.address?.state]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <p>
                  {patient.address?.country ?? ""}{" "}
                  {patient.address?.postalCode
                    ? `· ${patient.address.postalCode}`
                    : ""}
                </p>
              </div>
            </section>

            <section className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Emergency Contact
              </h2>
              <div className="text-sm text-gray-700">
                <p className="font-medium text-gray-900">
                  {patient.emergencyContact?.name ?? "-"}
                </p>
                <p>{patient.emergencyContact?.relationship ?? ""}</p>
                <p>{patient.emergencyContact?.phoneNumber ?? "-"}</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
