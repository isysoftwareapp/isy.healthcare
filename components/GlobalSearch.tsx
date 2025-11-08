"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  patients: any[];
  appointments: any[];
  invoices: any[];
}

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Keyboard shortcut (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }

      if (e.key === "Escape") {
        setIsOpen(false);
        setQuery("");
        setResults(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search API call
  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        try {
          const response = await fetch(
            `/api/search?q=${encodeURIComponent(query)}`
          );
          const data = await response.json();
          setResults(data.results);
          setIsOpen(true);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults(null);
        setIsOpen(false);
      }
    }, 300); // Debounce

    return () => clearTimeout(delaySearch);
  }, [query]);

  const allResults = results
    ? [
        ...results.patients.map((p) => ({ type: "patient", data: p })),
        ...results.appointments.map((a) => ({ type: "appointment", data: a })),
        ...results.invoices.map((i) => ({ type: "invoice", data: i })),
      ]
    : [];

  const handleResultClick = (item: any) => {
    switch (item.type) {
      case "patient":
        router.push(`/dashboard/patients/${item.data._id}`);
        break;
      case "appointment":
        router.push(`/dashboard/appointments/${item.data._id}`);
        break;
      case "invoice":
        router.push(`/dashboard/billing/${item.data._id}`);
        break;
    }
    setIsOpen(false);
    setQuery("");
    setResults(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, allResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && allResults[selectedIndex]) {
      e.preventDefault();
      handleResultClick(allResults[selectedIndex]);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-lg">
      <div className="relative">
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Search patients, appointments... (Ctrl+K)"
          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <svg
          className="absolute left-3 top-3 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {loading && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {allResults.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No results found for "{query}"
            </div>
          ) : (
            <div>
              {/* Patients */}
              {results.patients.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                    Patients ({results.patients.length})
                  </div>
                  {results.patients.map((patient, index) => {
                    const globalIndex = index;
                    return (
                      <button
                        key={patient._id}
                        onClick={() =>
                          handleResultClick({ type: "patient", data: patient })
                        }
                        className={`w-full text-left px-4 py-3 hover:bg-gray-100 border-b border-gray-100 ${
                          selectedIndex === globalIndex
                            ? "bg-blue-50"
                            : ""
                        }`}
                      >
                        <div className="font-medium text-gray-900">
                          {patient.firstName} {patient.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {patient.email} • {patient.phone}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Appointments */}
              {results.appointments.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                    Appointments ({results.appointments.length})
                  </div>
                  {results.appointments.map((appointment, index) => {
                    const globalIndex = results.patients.length + index;
                    return (
                      <button
                        key={appointment._id}
                        onClick={() =>
                          handleResultClick({
                            type: "appointment",
                            data: appointment,
                          })
                        }
                        className={`w-full text-left px-4 py-3 hover:bg-gray-100 border-b border-gray-100 ${
                          selectedIndex === globalIndex
                            ? "bg-blue-50"
                            : ""
                        }`}
                      >
                        <div className="font-medium text-gray-900">
                          {appointment.patient?.firstName}{" "}
                          {appointment.patient?.lastName} -{" "}
                          {appointment.doctor?.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(
                            appointment.appointmentDate
                          ).toLocaleDateString()}{" "}
                          • {appointment.reason}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Invoices */}
              {results.invoices.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
                    Invoices ({results.invoices.length})
                  </div>
                  {results.invoices.map((invoice, index) => {
                    const globalIndex =
                      results.patients.length +
                      results.appointments.length +
                      index;
                    return (
                      <button
                        key={invoice._id}
                        onClick={() =>
                          handleResultClick({ type: "invoice", data: invoice })
                        }
                        className={`w-full text-left px-4 py-3 hover:bg-gray-100 ${
                          selectedIndex === globalIndex
                            ? "bg-blue-50"
                            : ""
                        }`}
                      >
                        <div className="font-medium text-gray-900">
                          Invoice #{invoice.invoiceNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {invoice.patient?.name} • ${invoice.totalAmount} •{" "}
                          {invoice.status}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

