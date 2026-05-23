import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch, isLoggedIn } from "../lib/api";
import MapPicker from "../components/MapPicker";
import ImageUploader from "../components/ImageUploader";
import { addLocalNotification } from "../lib/notifications";
import { usePaymentGuard } from "../lib/usePaymentGuard";
import { formatMoney } from "../lib/wallet";

/** Fallback used if browser geolocation is unavailable and the user does not move the pin. */
const DEFAULT_LOCATION = { lat: 23.8103, lng: 90.4125 };

const RENTAL_TYPE_OPTIONS = [
  {
    value: "residential",
    label: "Residential",
    description: "Homes, flats, and apartments for tenants.",
  },
  {
    value: "commercial",
    label: "Commercial",
    description: "Office, retail, warehouse, and service spaces.",
  },
];

const COMMERCIAL_PROPERTY_TYPE_OPTIONS = [
  { value: "OFFICE", label: "Office space" },
  { value: "RETAIL", label: "Retail shop" },
  { value: "WAREHOUSE", label: "Warehouse" },
  { value: "RESTAURANT", label: "Restaurant / cafe" },
  { value: "OTHER", label: "Other commercial space" },
];

const COMMERCIAL_AMENITY_OPTIONS = [
  { name: "commercial_amenity_parking", label: "Customer parking" },
  { name: "commercial_amenity_loading", label: "Loading access" },
  { name: "commercial_amenity_frontage", label: "Street frontage" },
  { name: "commercial_amenity_washroom", label: "Private washroom" },
  { name: "commercial_amenity_power_backup", label: "Power backup ready" },
  { name: "commercial_amenity_security", label: "On-site security" },
];

const FORM_STEPS = [
  {
    title: "Property basics",
    description: "Start with the details tenants read first.",
    requiredFields: [
      "title",
      "description",
      "property_size",
      "room_count",
      "bathroom_count",
      "balcony_count",
    ],
  },
  {
    title: "Location",
    description: "Set the area, address, and map pin.",
    requiredFields: ["area_name"],
  },
  {
    title: "Building info",
    description: "Add floor, facing, and amenity details.",
    requiredFields: ["building_floors"],
  },
  {
    title: "Tenant & rent",
    description: "Finish with tenant preference and monthly rent.",
    requiredFields: ["rent"],
  },
];

const FIELD_LABELS = {
  title: "title",
  description: "description",
  property_size: "size",
  room_count: "rooms",
  bathroom_count: "bathrooms",
  balcony_count: "balconies",
  commercial_property_type: "commercial property type",
  commercial_square_footage: "square footage",
  area_name: "area",
  building_floors: "building floors",
  rent: "monthly rent",
};

const FIELD_MINIMUMS = {
  property_size: 0,
  room_count: 0,
  bathroom_count: 0,
  balcony_count: 0,
  commercial_square_footage: 1,
  building_floors: 1,
  rent: 0,
};

function RentalTypeSelector({ value, onChange }) {
  return (
    <div>
      <p className="block text-sm font-medium text-gray-700 mb-2">
        Space for rent
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {RENTAL_TYPE_OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              className={`cursor-pointer rounded-xl border p-4 transition ${selected
                  ? "border-teal-600 bg-teal-50 ring-2 ring-teal-100"
                  : "border-gray-200 bg-gray-50 hover:bg-white"
                }`}
            >
              <input
                type="radio"
                name="rental_type"
                value={option.value}
                checked={selected}
                onChange={onChange}
                className="sr-only"
              />
              <span className="block text-sm font-bold text-gray-900">
                {option.label}
              </span>
              <span className="mt-1 block text-xs leading-5 text-gray-500">
                {option.description}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function CommercialBasicsFields({
  form,
  onChange,
  onToggle,
  inputClass,
  labelClass,
}) {
  return (
    <>
      <div>
        <label className={labelClass}>Listing title</label>
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={onChange}
          className={inputClass}
          placeholder="Ground floor retail space in Gulshan"
          required
        />
      </div>

      <div>
        <label className={labelClass}>Commercial property type</label>
        <select
          name="commercial_property_type"
          value={form.commercial_property_type}
          onChange={onChange}
          className={inputClass}
          required
        >
          <option value="">Select commercial type</option>
          {COMMERCIAL_PROPERTY_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Square footage</label>
        <input
          type="number"
          name="commercial_square_footage"
          value={form.commercial_square_footage}
          onChange={onChange}
          className={inputClass}
          placeholder="e.g. 2200"
          min="1"
          required
        />
      </div>

      <div>
        <label className={labelClass}>Commercial space description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={onChange}
          className={`${inputClass} min-h-24`}
          placeholder="Describe storefront access, visibility, floor plan, utilities, and fit-out condition..."
          required
        />
      </div>

      <div>
        <p className={labelClass}>Commercial amenities</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {COMMERCIAL_AMENITY_OPTIONS.map((amenity) => (
            <label
              key={amenity.name}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700"
            >
              <input
                type="checkbox"
                name={amenity.name}
                checked={Boolean(form[amenity.name])}
                onChange={onToggle(amenity.name)}
              />
              {amenity.label}
            </label>
          ))}
        </div>
      </div>
    </>
  );
}

function CommercialMediaUploadPanel({ propertyId }) {
  return (
    <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-4">
      <h3 className="text-sm font-bold text-teal-900">
        Commercial photos and videos
      </h3>
      <p className="mt-1 text-sm text-teal-800">
        Add storefront, floor-plan, utility, and access media from this Tenant &
        Rent tab.
      </p>
      <div className="mt-3">
        {propertyId ? (
          <ImageUploader
            propertyId={propertyId}
            initialImages={[]}
            onUpdate={() => { }}
          />
        ) : (
          <div className="rounded-lg border border-dashed border-teal-200 bg-white/70 px-4 py-3 text-sm text-teal-800">
            Uploads unlock here after the listing details are submitted.
          </div>
        )}
      </div>
    </div>
  );
}

function ListingCompletionModal({ open, onClose, isCommercial }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/45 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-bold text-gray-900">
          Listing completed
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Your {isCommercial ? "commercial" : "residential"} listing has been
          completed successfully.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function formatApiError(body) {
  if (!body) return "";
  if (Array.isArray(body.errors) && body.errors.length > 0) {
    return body.errors.map((e) => `${e.field}: ${e.message}`).join("; ");
  }
  return body.error || body.message || "";
}

function getCommercialTypeLabel(value) {
  return (
    COMMERCIAL_PROPERTY_TYPE_OPTIONS.find((option) => option.value === value)
      ?.label || "Commercial space"
  );
}

function getSelectedCommercialAmenities(form) {
  return COMMERCIAL_AMENITY_OPTIONS.filter((amenity) => form[amenity.name]).map(
    (amenity) => amenity.label,
  );
}

function buildCommercialDescription(form) {
  const details = [
    `Commercial type: ${getCommercialTypeLabel(form.commercial_property_type)}`,
    `Square footage: ${form.commercial_square_footage} sqft`,
  ];
  const amenities = getSelectedCommercialAmenities(form);
  if (amenities.length > 0) details.push(`Amenities: ${amenities.join(", ")}`);

  return `${form.description.trim()}\n\n${details.join("\n")}`;
}

export default function CreateListingPage() {
  const [form, setForm] = useState({
    rental_type: "residential",
    title: "",
    description: "",
    property_size: "",
    room_count: "",
    bathroom_count: "",
    balcony_count: "0",
    commercial_property_type: "",
    commercial_square_footage: "",
    commercial_amenity_parking: false,
    commercial_amenity_loading: false,
    commercial_amenity_frontage: false,
    commercial_amenity_washroom: false,
    commercial_amenity_power_backup: false,
    commercial_amenity_security: false,
    area_name: "",
    address: "",
    building_floors: "",
    building_facing: "NORTH",
    has_lift: false,
    has_generator: false,
    has_security_guard: false,
    intended_tenant_type: "BOTH",
    rent: "",
  });
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdPropertyId, setCreatedPropertyId] = useState(null);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const finalStepEnabledAtRef = useRef(0);

  const isCommercialFlow = form.rental_type === "commercial";
  const showWizard = !createdPropertyId || isCommercialFlow;
  const currentStepConfig = FORM_STEPS[currentStep];
  const isLastStep = currentStep === FORM_STEPS.length - 1;
  const listingRentForFee = useMemo(() => {
    const rent = Number(form.rent);
    return Number.isFinite(rent) && rent > 0 ? rent : undefined;
  }, [form.rent]);

  const createListingPayment = usePaymentGuard({
    feeCode: "LISTING_CREATE",
    enabled: !createdPropertyId,
    percentBaseValue: listingRentForFee,
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleToggle = (name) => (e) => {
    setForm((prev) => ({ ...prev, [name]: e.target.checked }));
    if (error) setError("");
  };

  const getStepRequiredFields = (stepIndex) => {
    if (stepIndex === 0 && isCommercialFlow) {
      return [
        "title",
        "description",
        "commercial_property_type",
        "commercial_square_footage",
      ];
    }

    return FORM_STEPS[stepIndex].requiredFields;
  };

  const handleFormKeyDown = (e) => {
    if (e.key === "Enter" && !isLastStep && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
    }
  };

  const getValidationMessage = (fieldNames) => {
    for (const fieldName of fieldNames) {
      const value = form[fieldName];
      const label = FIELD_LABELS[fieldName] || fieldName;

      if (String(value ?? "").trim() === "") {
        return `Please complete the ${label} before continuing.`;
      }

      if (Object.prototype.hasOwnProperty.call(FIELD_MINIMUMS, fieldName)) {
        const numericValue = Number(value);
        if (
          Number.isNaN(numericValue) ||
          numericValue < FIELD_MINIMUMS[fieldName]
        ) {
          return `Please enter a valid ${label}.`;
        }
      }
    }

    return "";
  };

  const scrollToPageTop = () => {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  };

  const handleNextStep = () => {
    const validationMessage = getValidationMessage(
      getStepRequiredFields(currentStep),
    );
    if (validationMessage) {
      setError(validationMessage);
      scrollToPageTop();
      return;
    }

    setError("");
    const nextStep = Math.min(currentStep + 1, FORM_STEPS.length - 1);
    if (nextStep === FORM_STEPS.length - 1) {
      finalStepEnabledAtRef.current = Date.now() + 500;
    }
    setCurrentStep(nextStep);
    scrollToPageTop();
  };

  const handlePreviousStep = () => {
    setError("");
    finalStepEnabledAtRef.current = 0;
    setCurrentStep((step) => Math.max(step - 1, 0));
    scrollToPageTop();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isLastStep) {
      handleNextStep();
      return;
    }
    if (Date.now() < finalStepEnabledAtRef.current) {
      return;
    }

    for (let stepIndex = 0; stepIndex < FORM_STEPS.length; stepIndex += 1) {
      const validationMessage = getValidationMessage(
        getStepRequiredFields(stepIndex),
      );
      if (validationMessage) {
        setCurrentStep(stepIndex);
        setError(validationMessage);
        scrollToPageTop();
        return;
      }
    }

    try {
      if (!isLoggedIn()) {
        setError("Not authenticated. Please log in again.");
        return;
      }

      const canPay = await createListingPayment.ensureSufficientBalance();
      if (!canPay) return;

      setLoading(true);

      const body = {
        title: form.title,
        description: isCommercialFlow
          ? buildCommercialDescription(form)
          : form.description,
        propertySizeSqft: parseFloat(
          isCommercialFlow
            ? form.commercial_square_footage
            : form.property_size,
        ),
        roomCount: isCommercialFlow ? 0 : parseFloat(form.room_count),
        bathroomCount: isCommercialFlow
          ? form.commercial_amenity_washroom
            ? 1
            : 0
          : parseFloat(form.bathroom_count),
        balconyCount: isCommercialFlow ? 0 : parseInt(form.balcony_count, 10),
        areaName: form.area_name || undefined,
        // Backend requires a string; omitting empty address breaks Zod validation.
        address: (form.address ?? "").trim(),
        exactLat: location?.lat ?? DEFAULT_LOCATION.lat,
        exactLng: location?.lng ?? DEFAULT_LOCATION.lng,
        buildingFloors: form.building_floors
          ? parseInt(form.building_floors, 10)
          : undefined,
        buildingFacing: form.building_facing,
        hasLift: !!form.has_lift,
        hasGenerator: !!form.has_generator,
        hasSecurityGuard: !!form.has_security_guard,
        intendedTenantType: form.intended_tenant_type,
      };

      const createPropertyRes = await apiFetch("/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const createPropertyBody = await createPropertyRes
        .json()
        .catch(() => ({}));
      if (!createPropertyRes.ok) {
        throw new Error(
          formatApiError(createPropertyBody) ||
          createPropertyBody?.message ||
          "Failed to create property",
        );
      }
      const propertyId = createPropertyBody?.data?.propertyId;
      if (!propertyId)
        throw new Error("Property created but property ID missing.");

      const now = new Date();
      const listingStartDate = new Date(
        now.getTime() + 60 * 1000,
      ).toISOString();
      const createListingRes = await apiFetch(
        `/properties/${propertyId}/listings`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rent: parseFloat(form.rent),
            listingStartDate,
          }),
        },
      );
      const createListingBody = await createListingRes.json().catch(() => ({}));
      if (!createListingRes.ok) {
        if (
          createListingPayment.handlePaymentRequiredResponse(
            createListingRes,
            createListingBody,
          )
        ) {
          return;
        }
        throw new Error(
          formatApiError(createListingBody) ||
          createListingBody?.message ||
          "Property created but listing creation failed",
        );
      }
      addLocalNotification({
        title: "Listing Created",
        message: "Your property listing was created successfully.",
        url: "/owner-dashboard/my-properties",
        type: "LISTING",
      });
      setCreatedPropertyId(propertyId);
      setCompletionModalOpen(true);
      scrollToPageTop();
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";
  const sectionClass =
    "bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 pr-14 sm:pr-16 flex items-center justify-between">
          <Link
            to="/owner-dashboard"
            className="text-2xl font-bold text-teal-800 tracking-tight"
          >
            RentNao
          </Link>
          <Link
            to="/owner-dashboard/my-properties"
            className="text-sm font-medium text-gray-600 hover:text-teal-700 transition"
          >
            &larr; My Properties
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          {createdPropertyId ? (
            <>
              <p className="text-sm font-semibold text-teal-700 mb-2">
                Listing ready
              </p>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Listing created
              </h1>
              <p className="text-gray-500">
                {isCommercialFlow
                  ? "Add commercial photos and videos in the Tenant & Rent tab, or return to your properties."
                  : "Add photos or return to your properties when you are done."}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-teal-700 mb-2">
                Step {currentStep + 1} of {FORM_STEPS.length}
              </p>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Create New Listing
              </h1>
              <p className="text-gray-500">
                Create a property first, then publish its listing section by
                section.
              </p>
            </>
          )}
        </div>

        {showWizard && (
          <div className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {FORM_STEPS.map((step, index) => {
                const isActive = index === currentStep;
                const isComplete = index < currentStep;
                return (
                  <div
                    key={step.title}
                    className={`rounded-xl border p-3 ${isActive
                        ? "border-teal-600 bg-teal-50 text-teal-900"
                        : isComplete
                          ? "border-teal-100 bg-white text-teal-700"
                          : "border-gray-100 bg-white text-gray-400"
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${isActive || isComplete
                            ? "bg-teal-700 text-white"
                            : "bg-gray-100 text-gray-400"
                          }`}
                      >
                        {index + 1}
                      </span>
                      <span className="text-sm font-semibold">
                        {step.title}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {showWizard && (
          <form
            onSubmit={handleSubmit}
            onKeyDown={handleFormKeyDown}
            className="space-y-5"
            noValidate
          >
            <section className={sectionClass}>
              <div>
                <p className="text-sm font-semibold text-teal-700">
                  Section {currentStep + 1}
                </p>
                <h2 className="text-xl font-bold text-gray-900 mt-1">
                  {currentStepConfig.title}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {currentStepConfig.description}
                </p>
              </div>

              {currentStep === 0 && (
                <>
                  <RentalTypeSelector
                    value={form.rental_type}
                    onChange={handleChange}
                  />

                  {isCommercialFlow ? (
                    <CommercialBasicsFields
                      form={form}
                      onChange={handleChange}
                      onToggle={handleToggle}
                      inputClass={inputClass}
                      labelClass={labelClass}
                    />
                  ) : (
                    <>
                      <div>
                        <label className={labelClass}>Title</label>
                        <input
                          type="text"
                          name="title"
                          value={form.title}
                          onChange={handleChange}
                          className={inputClass}
                          placeholder="3 Bedroom Apartment in Dhanmondi"
                          required
                        />
                      </div>

                      <div>
                        <label className={labelClass}>Description</label>
                        <textarea
                          name="description"
                          value={form.description}
                          onChange={handleChange}
                          className={`${inputClass} min-h-24`}
                          placeholder="Describe the property..."
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>Size (sqft)</label>
                          <input
                            type="number"
                            name="property_size"
                            value={form.property_size}
                            onChange={handleChange}
                            className={inputClass}
                            placeholder="e.g. 1450"
                            min="0"
                            required
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Rooms / Beds</label>
                          <input
                            type="number"
                            name="room_count"
                            value={form.room_count}
                            onChange={handleChange}
                            className={inputClass}
                            placeholder="e.g. 3"
                            min="0"
                            required
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Bathrooms</label>
                          <input
                            type="number"
                            name="bathroom_count"
                            value={form.bathroom_count}
                            onChange={handleChange}
                            className={inputClass}
                            placeholder="e.g. 2"
                            min="0"
                            required
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Balconies</label>
                          <input
                            type="number"
                            name="balcony_count"
                            value={form.balcony_count}
                            onChange={handleChange}
                            className={inputClass}
                            min="0"
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {currentStep === 1 && (
                <>
                  <div>
                    <label className={labelClass}>Area / Location</label>
                    <select
                      name="area_name"
                      value={form.area_name}
                      onChange={handleChange}
                      className={inputClass}
                      required
                    >
                      <option value="">Select area</option>
                      <option value="DHANMONDI">Dhanmondi</option>
                      <option value="GULSHAN">Gulshan</option>
                      <option value="BANANI">Banani</option>
                      <option value="UTTARA">Uttara</option>
                      <option value="MIRPUR">Mirpur</option>
                      <option value="MOHAMMADPUR">Mohammadpur</option>
                      <option value="BASHUNDHARA">Bashundhara</option>
                      <option value="BADDA">Badda</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Address</label>
                    <input
                      type="text"
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Street, building, area"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Map location (uses your current location when allowed;
                      click to adjust pin)
                    </label>
                    <div
                      className="rounded-xl overflow-hidden border border-gray-200"
                      style={{ height: "280px" }}
                    >
                      <MapPicker
                        value={location}
                        onChange={setLocation}
                        height="280px"
                      />
                    </div>
                  </div>
                </>
              )}

              {currentStep === 2 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Building Floors</label>
                      <input
                        type="number"
                        name="building_floors"
                        value={form.building_floors}
                        onChange={handleChange}
                        className={inputClass}
                        min="1"
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Building Facing</label>
                      <select
                        name="building_facing"
                        value={form.building_facing}
                        onChange={handleChange}
                        className={inputClass}
                      >
                        <option value="NORTH">North</option>
                        <option value="SOUTH">South</option>
                        <option value="EAST">East</option>
                        <option value="WEST">West</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        name="has_lift"
                        checked={form.has_lift}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            has_lift: e.target.checked,
                          }))
                        }
                      />
                      Lift
                    </label>
                    <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        name="has_generator"
                        checked={form.has_generator}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            has_generator: e.target.checked,
                          }))
                        }
                      />
                      Generator
                    </label>
                    <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        name="has_security_guard"
                        checked={form.has_security_guard}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            has_security_guard: e.target.checked,
                          }))
                        }
                      />
                      Security Guard
                    </label>
                  </div>
                </>
              )}

              {currentStep === 3 && (
                <>
                  <div>
                    <label className={labelClass}>Intended Tenant Type</label>
                    <select
                      name="intended_tenant_type"
                      value={form.intended_tenant_type}
                      onChange={handleChange}
                      className={inputClass}
                      disabled={Boolean(createdPropertyId)}
                    >
                      <option value="BOTH">Both</option>
                      <option value="FAMILY">Family</option>
                      <option value="BACHELOR">Bachelor</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Monthly Rent ($)</label>
                    <input
                      type="number"
                      name="rent"
                      value={form.rent}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="e.g. 15000"
                      min="0"
                      required
                      disabled={Boolean(createdPropertyId)}
                    />
                  </div>

                  {!createdPropertyId && (
                    <div className="rounded-xl border border-teal-100 bg-teal-50/70 px-4 py-3 text-sm text-teal-900">
                      <p className="font-semibold">
                        {createListingPayment.fee &&
                        Number(createListingPayment.requiredAmount) === 0
                          ? "No listing fee required"
                          : "Payment required before publishing"}
                      </p>
                      <p className="mt-1">
                        Listing creation fee:{" "}
                        {createListingPayment.fee
                          ? Number(createListingPayment.requiredAmount) === 0
                            ? formatMoney(0, createListingPayment.currency)
                            : formatMoney(
                                createListingPayment.requiredAmount,
                                createListingPayment.currency,
                              )
                          : "Loading payment amount..."}
                      </p>
                      {createListingPayment.availableBalance ? (
                        <p className="mt-1">
                          Wallet balance:{" "}
                          {formatMoney(
                            createListingPayment.availableBalance,
                            createListingPayment.currency,
                          )}
                        </p>
                      ) : null}
                      {createListingPayment.error ? (
                        <p className="mt-1 text-red-600">
                          {createListingPayment.error}
                        </p>
                      ) : null}
                    </div>
                  )}

                  {isCommercialFlow && (
                    <CommercialMediaUploadPanel
                      propertyId={createdPropertyId}
                    />
                  )}
                </>
              )}
            </section>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
              <button
                type="button"
                onClick={handlePreviousStep}
                disabled={
                  currentStep === 0 || loading || Boolean(createdPropertyId)
                }
                className="px-5 py-3 rounded-lg border border-gray-200 text-gray-700 font-semibold transition hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>

              {isLastStep && createdPropertyId && isCommercialFlow ? (
                <Link
                  to="/owner-dashboard/my-properties"
                  className="bg-teal-700 hover:bg-teal-800 text-white font-semibold px-6 py-3 rounded-lg transition"
                >
                  Done - My Properties
                </Link>
              ) : isLastStep ? (
                <button
                  type="submit"
                  disabled={
                    loading ||
                    createListingPayment.loading ||
                    !createListingPayment.fee
                  }
                  className="bg-teal-700 hover:bg-teal-800 text-white font-semibold px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading || createListingPayment.loading
                    ? "Checking wallet..."
                    : "Create Property & Listing"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={loading}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-semibold px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              )}
            </div>
          </form>
        )}

        {createdPropertyId && !isCommercialFlow && (
          <div className="mt-10 p-6 bg-white rounded-xl border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Add photos and videos
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Upload media now, or go back to My Properties when you are done.
            </p>
            <ImageUploader
              propertyId={createdPropertyId}
              initialImages={[]}
              onUpdate={() => { }}
            />
            <Link
              to="/owner-dashboard/my-properties"
              className="inline-block mt-4 text-teal-700 font-semibold text-sm hover:text-teal-800"
            >
              Done — My Properties &rarr;
            </Link>
          </div>
        )}
      </main>
      <ListingCompletionModal
        open={completionModalOpen}
        onClose={() => setCompletionModalOpen(false)}
        isCommercial={isCommercialFlow}
      />
      {createListingPayment.modal}
    </div>
  );
}