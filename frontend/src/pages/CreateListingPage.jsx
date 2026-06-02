import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, isLoggedIn } from "../lib/api";
import MapPicker from "../components/MapPicker";
import ImageUploader from "../components/ImageUploader";
import AppHeader from "../components/AppHeader";
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
    requiredFields: ["building_floors", "floor_no", "flat_no"],
  },
  {
    title: "Tenant & rent",
    description: "Set rent, add photos or videos, then publish.",
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
  floor_no: "floor number",
  flat_no: "flat number",
  rent: "monthly rent",
};

const FIELD_MINIMUMS = {
  property_size: 0,
  room_count: 0,
  bathroom_count: 0,
  balcony_count: 0,
  commercial_square_footage: 1,
  building_floors: 1,
  floor_no: 1,
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

function PropertyMediaUploadPanel({ propertyId, preparing }) {
  return (
    <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-4">
      <h3 className="text-sm font-bold text-teal-900">Photos and videos</h3>
      <p className="mt-1 text-sm text-teal-800">
        Add listing media before you publish.
      </p>
      <div className="mt-3">
        {propertyId ? (
          <ImageUploader
            propertyId={propertyId}
            initialImages={[]}
            onUpdate={() => {}}
          />
        ) : preparing ? (
          <div className="rounded-lg border border-dashed border-teal-200 bg-white/70 px-4 py-3 text-sm text-teal-800">
            Preparing uploads…
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-teal-200 bg-white/70 px-4 py-3 text-sm text-teal-800">
            Complete the previous steps to enable uploads.
          </div>
        )}
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
  const navigate = useNavigate();
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
    floor_no: "",
    flat_no: "",
  });
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [draftPropertyId, setDraftPropertyId] = useState(null);
  const [draftSaving, setDraftSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const finalStepEnabledAtRef = useRef(0);

  const isCommercialFlow = form.rental_type === "commercial";
  const currentStepConfig = FORM_STEPS[currentStep];
  const isLastStep = currentStep === FORM_STEPS.length - 1;
  const listingRentForFee = useMemo(() => {
    const rent = Number(form.rent);
    return Number.isFinite(rent) && rent > 0 ? rent : undefined;
  }, [form.rent]);

  const createListingPayment = usePaymentGuard({
    feeCode: "LISTING_CREATE",
    enabled: true,
    percentBaseValue: listingRentForFee,
  });

  const buildPropertyBody = () => ({
    title: form.title,
    description: isCommercialFlow
      ? buildCommercialDescription(form)
      : form.description,
    propertySizeSqft: parseFloat(
      isCommercialFlow ? form.commercial_square_footage : form.property_size,
    ),
    roomCount: isCommercialFlow ? 0 : parseFloat(form.room_count),
    bathroomCount: isCommercialFlow
      ? form.commercial_amenity_washroom
        ? 1
        : 0
      : parseFloat(form.bathroom_count),
    balconyCount: isCommercialFlow ? 0 : parseInt(form.balcony_count, 10),
    areaName: form.area_name || undefined,
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
    propertyType: isCommercialFlow ? "COMMERCIAL_SPACE" : "APARTMENT",
    floorNo: form.floor_no ? parseInt(form.floor_no, 10) : undefined,
    flatNo: (form.flat_no ?? "").trim() || undefined,
  });

  const ensureDraftProperty = async () => {
    if (draftPropertyId) return draftPropertyId;

    if (!isLoggedIn()) {
      throw new Error("Not authenticated. Please log in again.");
    }

    const createPropertyRes = await apiFetch("/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPropertyBody()),
    });
    const createPropertyBody = await createPropertyRes.json().catch(() => ({}));
    if (!createPropertyRes.ok) {
      throw new Error(
        formatApiError(createPropertyBody) ||
          createPropertyBody?.message ||
          "Failed to prepare property for media upload",
      );
    }

    const propertyId = createPropertyBody?.data?.propertyId;
    if (!propertyId) {
      throw new Error("Property draft created but property ID missing.");
    }

    setDraftPropertyId(propertyId);
    return propertyId;
  };

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
    if (stepIndex === 2) {
      return isCommercialFlow
        ? ["building_floors", "floor_no"]
        : ["building_floors", "floor_no", "flat_no"];
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

  const handleNextStep = async () => {
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

    if (nextStep === FORM_STEPS.length - 1 && nextStep !== currentStep) {
      setDraftSaving(true);
      try {
        await ensureDraftProperty();
      } catch (err) {
        setError(err.message || "Failed to prepare property for uploads");
        scrollToPageTop();
        return;
      } finally {
        setDraftSaving(false);
      }
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
      await handleNextStep();
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

      let propertyId = draftPropertyId;
      if (propertyId) {
        const updatePropertyRes = await apiFetch(`/properties/${propertyId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPropertyBody()),
        });
        const updatePropertyBody = await updatePropertyRes
          .json()
          .catch(() => ({}));
        if (!updatePropertyRes.ok) {
          throw new Error(
            formatApiError(updatePropertyBody) ||
              updatePropertyBody?.message ||
              "Failed to update property",
          );
        }
      } else {
        const createPropertyRes = await apiFetch("/properties", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPropertyBody()),
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
        propertyId = createPropertyBody?.data?.propertyId;
        if (!propertyId) {
          throw new Error("Property created but property ID missing.");
        }
      }

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
      navigate("/owner-dashboard/my-properties");
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
      <AppHeader />

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
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
        </div>

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

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Floor Number</label>
                      <input
                        type="number"
                        name="floor_no"
                        value={form.floor_no}
                        onChange={handleChange}
                        className={inputClass}
                        min="1"
                        placeholder="e.g. 4"
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClass}>
                        Flat / Unit Number {isCommercialFlow && "(Optional)"}
                      </label>
                      <input
                        type="text"
                        name="flat_no"
                        value={form.flat_no}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="e.g. 4B"
                        required={!isCommercialFlow}
                      />
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
                    />
                  </div>

                  <PropertyMediaUploadPanel
                    propertyId={draftPropertyId}
                    preparing={draftSaving}
                  />

                  <div className="rounded-xl border border-teal-100 bg-teal-50/70 px-4 py-3 text-sm text-teal-900">
                      <p className="font-semibold">
                        Payment required before publishing
                      </p>
                      <p className="mt-1">
                        Listing creation fee:{" "}
                        {createListingPayment.fee
                          ? formatMoney(
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
                </>
              )}
            </section>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
              <button
                type="button"
                onClick={handlePreviousStep}
                disabled={currentStep === 0 || loading || draftSaving}
                className="px-5 py-3 rounded-lg border border-gray-200 text-gray-700 font-semibold transition hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>

              {isLastStep ? (
                <button
                  type="submit"
                  disabled={
                    loading ||
                    draftSaving ||
                    createListingPayment.loading ||
                    !createListingPayment.fee
                  }
                  className="bg-teal-700 hover:bg-teal-800 text-white font-semibold px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading || createListingPayment.loading
                    ? "Checking wallet..."
                    : draftSaving
                      ? "Preparing..."
                      : "Create Property & Listing"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={loading || draftSaving}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-semibold px-6 py-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {draftSaving ? "Preparing..." : "Continue"}
                </button>
              )}
            </div>
          </form>
      </main>
      {createListingPayment.modal}
    </div>
  );
}