"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createShelf,
  getShelves,
  getStores,
  updateShelf,
  deleteShelf,
} from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { AccentIcon } from "@/components/ui/AccentIcon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/Field";
import { SearchInput } from "@/components/SearchInput";
import { Pagination } from "@/components/Pagination";
import { TableState } from "@/components/TableState";
import { AccessDenied } from "@/components/AccessDenied";
import { EmptyState } from "@/components/ui/EmptyState";
import { ZonePreview } from "@/components/shelves/ZonePreview";
import {
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/Menu";
import {
  IdCell,
  TableShell,
  TableToolbar,
  TD,
  TH,
  THead,
  TRow,
} from "@/components/ui/Table";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  LayoutGrid,
  MoreHorizontal,
  Pencil,
  Plus,
  Rows3,
  Store as StoreIcon,
  Trash2,
  X,
} from "lucide-react";

type Store = {
  id: number;
  name: string;
  location: string;
};

type Shelf = {
  id: number;
  shelf_name: string;
  zone_coordinates: string;
  store_id: number;
};

type ViewMode = "grid" | "table";

const PAGE_SIZE = 9;

const COORDINATE_EXAMPLE = "[(100,50),(250,50),(250,200),(100,200)]";

export default function ShelvesPage() {
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  const [storeId, setStoreId] = useState<number>(1);
  const [shelfName, setShelfName] = useState("");
  const [zoneCoordinates, setZoneCoordinates] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  // null until the stored role has been read, so the guard below never flashes
  // Access Denied at a user who is actually permitted.
  const [role, setRole] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loadingShelves, setLoadingShelves] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<ViewMode>("grid");

  async function loadStores() {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      const data = await getStores(token);
      setStores(data);

      if (data.length > 0) {
        setStoreId(data[0].id);
        loadShelves(data[0].id);
      } else {
        setLoadingShelves(false);
      }
    } catch (error) {
      console.error(error);
      setStores([]);
      setLoadError("Could not load stores.");
      setLoadingShelves(false);
    }
  }

  async function loadShelves(id: number) {
    const token = localStorage.getItem("token");

    if (!token) return;

    setLoadingShelves(true);

    setLoadError("");

    try {
      const data = await getShelves(id, token);
      setShelves(data);
    } catch (error) {
      // Keep the list a list. Storing an error body here used to crash the
      // page rather than showing that the request failed.
      console.error(error);
      setShelves([]);
      setLoadError("Could not load shelves for this store.");
    } finally {
      setLoadingShelves(false);
    }
  }

  useEffect(() => {
    setRole(localStorage.getItem("role") || "");
  }, []);

  useEffect(() => {
    if (role === null) return;

    // Don't call the shelf endpoints at all for a role the API would reject.
    if (!can(role, "viewShelves")) {
      setLoadingShelves(false);
      return;
    }

    loadStores();
  }, [role]);

  const filteredShelves = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return shelves;

    return shelves.filter((shelf) =>
      shelf.shelf_name.toLowerCase().includes(query)
    );
  }, [shelves, search]);

  const totalPages = Math.max(1, Math.ceil(filteredShelves.length / PAGE_SIZE));

  const paginatedShelves = filteredShelves.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  function handleStoreChange(id: number) {
    setStoreId(id);
    setSearch("");
    setEditingId(null);
    setShelfName("");
    setZoneCoordinates("");
    loadShelves(id);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) return;

    setSaving(true);

    try {
      if (editingId === null) {
        await createShelf(storeId, shelfName, zoneCoordinates, token);
      } else {
        await updateShelf(editingId, shelfName, zoneCoordinates, token);
        setEditingId(null);
      }

      setShelfName("");
      setZoneCoordinates("");

      await loadShelves(storeId);
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(shelf: Shelf) {
    setEditingId(shelf.id);
    setShelfName(shelf.shelf_name);
    setZoneCoordinates(shelf.zone_coordinates);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setShelfName("");
    setZoneCoordinates("");
  }

  async function handleDelete(id: number) {
    const token = localStorage.getItem("token");

    if (!token) return;

    if (!confirm("Delete this shelf?")) return;

    await deleteShelf(id, token);

    await loadShelves(storeId);
  }

  const selectedStoreName = stores.find((s) => s.id === storeId)?.name;

  if (role === null) {
    return null;
  }

  if (!can(role, "viewShelves")) {
    return <AccessDenied role={role} />;
  }

  const canManage = can(role, "manageShelves");

  return (
    <>
      <PageHeader
        title="Shelf Management"
        subtitle="Define the shelf zones the vision pipeline maps shopper attention onto."
        eyebrow={
          <>
            <StatusBadge variant="behavior" dot>
              {shelves.length} {shelves.length === 1 ? "zone" : "zones"}
            </StatusBadge>

            {selectedStoreName && (
              <StatusBadge variant="neutral" outline>
                {selectedStoreName}
              </StatusBadge>
            )}
          </>
        }
        actions={
          <>
            <div
              role="group"
              aria-label="View mode"
              className="flex items-center gap-1 rounded-xl border border-line bg-surface p-1"
            >
              {(
                [
                  ["grid", LayoutGrid, "Card view"],
                  ["table", Rows3, "Table view"],
                ] as const
              ).map(([mode, Icon, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setView(mode)}
                  aria-label={label}
                  aria-pressed={view === mode}
                  title={label}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-200",
                    view === mode
                      ? "bg-behavior-soft text-behavior-strong"
                      : "text-ink-subtle hover:text-ink"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>

            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search shelves…"
              className="w-full sm:w-56"
            />
          </>
        }
      />

      {/* ── Store scope ───────────────────────────────────────────────── */}
      <Card className="animate-rise-in mb-5 p-5 sm:p-6">
        <CardHeader
          icon={<AccentIcon icon={StoreIcon} variant="analytics" />}
          title="Store scope"
          description="Shelves belong to one store. Pick the store whose zones you want to work on."
          action={
            <StatusBadge variant="analytics" size="sm">
              {stores.length} available
            </StatusBadge>
          }
        />

        {stores.length === 0 ? (
          <EmptyState
            icon={StoreIcon}
            title="No stores registered"
            description="A shelf needs a store to belong to. Add a store first."
            variant="analytics"
            compact
          />
        ) : (
          <Field label="Store" className="max-w-sm">
            {(id) => (
              <Select
                id={id}
                value={storeId}
                onChange={(event) =>
                  handleStoreChange(Number(event.target.value))
                }
              >
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name} — {store.location}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
      </Card>

      {/* ── Create / edit ─────────────────────────────────────────────── */}
      {canManage && stores.length > 0 && (
        <Card
          className="animate-rise-in mb-6 p-5 sm:p-6"
          accent={editingId === null ? undefined : "warning"}
        >
          <CardHeader
            icon={
              <AccentIcon
                icon={editingId === null ? Plus : Pencil}
                variant={editingId === null ? "brand" : "warning"}
              />
            }
            title={
              editingId === null
                ? `Add a shelf${selectedStoreName ? ` — ${selectedStoreName}` : ""}`
                : `Edit shelf #${editingId}`
            }
            description="A shelf zone is a polygon in camera-frame coordinates. Sessions inside it are attributed to this shelf."
            action={
              editingId !== null ? (
                <Button variant="ghost" size="sm" onClick={cancelEdit}>
                  <X />
                  Cancel
                </Button>
              ) : undefined
            }
          />

          <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-5">
              <Field label="Shelf name" required>
                {(id) => (
                  <Input
                    id={id}
                    value={shelfName}
                    onChange={(event) => setShelfName(event.target.value)}
                    placeholder="Beverages — Aisle 3"
                    icon={LayoutGrid}
                    required
                  />
                )}
              </Field>

              <Field
                label="Zone coordinates"
                required
                description="A list of (x, y) polygon points defining the shelf zone in the camera frame."
                hint={
                  <button
                    type="button"
                    onClick={() => setZoneCoordinates(COORDINATE_EXAMPLE)}
                    className="rounded font-medium text-brand-deep transition-colors duration-200 hover:text-brand-strong"
                  >
                    Use example
                  </button>
                }
              >
                {(id) => (
                  <Input
                    id={id}
                    value={zoneCoordinates}
                    onChange={(event) => setZoneCoordinates(event.target.value)}
                    placeholder={COORDINATE_EXAMPLE}
                    className="font-mono text-[0.8125rem]"
                    required
                  />
                )}
              </Field>

              <Button type="submit" size="lg" loading={saving}>
                {!saving && (editingId === null ? <Plus /> : <Pencil />)}
                {editingId === null ? "Add shelf" : "Update shelf"}
              </Button>
            </div>

            {/* Live preview of the polygon being typed. */}
            <div className="rounded-xl border border-line bg-surface-sunken/40 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-ink-subtle">
                Zone preview
              </p>

              <ZonePreview
                coordinates={zoneCoordinates}
                label={shelfName || "New shelf"}
              />
            </div>
          </form>
        </Card>
      )}

      {loadError && (
        <div
          role="alert"
          className="animate-fade-in mb-5 flex items-start gap-2.5 rounded-xl border border-critical-soft bg-critical-soft/40 px-4 py-3 text-sm text-critical-strong"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {loadError}
        </div>
      )}

      {/* ── Records ───────────────────────────────────────────────────── */}
      <TableToolbar
        className="mb-4"
        count={
          <>
            <span className="font-medium text-ink">
              {filteredShelves.length}
            </span>{" "}
            {filteredShelves.length === 1 ? "shelf" : "shelves"}
            {selectedStoreName ? ` in ${selectedStoreName}` : ""}
          </>
        }
      />

      {view === "grid" ? (
        loadingShelves ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <Card key={index} className="h-56 animate-pulse bg-surface-sunken" />
            ))}
          </div>
        ) : paginatedShelves.length === 0 ? (
          <Card className="p-5">
            <EmptyState
              icon={LayoutGrid}
              title={search ? "No shelves match your search" : "No shelves yet"}
              description={
                search
                  ? "Try a different shelf name."
                  : canManage
                    ? "Add a shelf zone so the pipeline can attribute sessions to it."
                    : "No shelf zones have been configured for this store."
              }
              variant="behavior"
              action={
                search ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearch("")}
                  >
                    Clear search
                  </Button>
                ) : undefined
              }
            />
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paginatedShelves.map((shelf, index) => (
              <ShelfCard
                key={shelf.id}
                shelf={shelf}
                storeName={
                  stores.find((store) => store.id === shelf.store_id)?.name
                }
                canManage={canManage}
                onEdit={() => handleEdit(shelf)}
                onDelete={() => handleDelete(shelf.id)}
                delay={index * 45}
              />
            ))}
          </div>
        )
      ) : (
        <Card className="overflow-hidden">
          <TableShell>
            <THead>
              <TH>ID</TH>
              <TH>Shelf</TH>
              <TH>Store</TH>
              <TH>Zone coordinates</TH>
              <TH align="right">Actions</TH>
            </THead>

            <tbody>
              {loadingShelves ? (
                <TableState colSpan={5} loading icon={LayoutGrid} message="" />
              ) : paginatedShelves.length === 0 ? (
                <TableState
                  colSpan={5}
                  loading={false}
                  icon={LayoutGrid}
                  message={
                    search ? "No shelves match your search" : "No shelves yet"
                  }
                  description="Configured shelf zones will appear here."
                  variant="behavior"
                />
              ) : (
                paginatedShelves.map((shelf) => (
                  <TRow key={shelf.id}>
                    <TD>
                      <IdCell>#{shelf.id}</IdCell>
                    </TD>

                    <TD>
                      <span className="flex items-center gap-2.5">
                        <AccentIcon
                          icon={LayoutGrid}
                          variant="behavior"
                          size="sm"
                        />
                        <span className="font-medium text-ink">
                          {shelf.shelf_name}
                        </span>
                      </span>
                    </TD>

                    <TD>
                      {stores.find((store) => store.id === shelf.store_id)?.name}
                    </TD>

                    <TD className="max-w-xs">
                      <span className="block truncate font-mono text-xs text-ink-subtle">
                        {shelf.zone_coordinates}
                      </span>
                    </TD>

                    <TD align="right">
                      {canManage ? (
                        <RowMenu
                          onEdit={() => handleEdit(shelf)}
                          onDelete={() => handleDelete(shelf.id)}
                        />
                      ) : (
                        <StatusBadge variant="neutral" size="sm">
                          View only
                        </StatusBadge>
                      )}
                    </TD>
                  </TRow>
                ))
              )}
            </tbody>
          </TableShell>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </Card>
      )}

      {view === "grid" && !loadingShelves && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          className="mt-5 rounded-2xl border border-line bg-surface"
        />
      )}
    </>
  );
}

/* ── Card presentation ────────────────────────────────────────────────── */

function ShelfCard({
  shelf,
  storeName,
  canManage,
  onEdit,
  onDelete,
  delay,
}: {
  shelf: Shelf;
  storeName?: string;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  delay: number;
}) {
  return (
    <Card
      glow="behavior"
      className="animate-rise-in stagger flex flex-col p-5"
      style={{ ["--delay" as string]: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-semibold text-ink">
            {shelf.shelf_name}
          </h3>

          <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-ink-muted">
            <StoreIcon
              className="h-3.5 w-3.5 shrink-0 text-ink-subtle"
              aria-hidden="true"
            />
            {storeName ?? `Store #${shelf.store_id}`}
          </p>
        </div>

        {canManage ? (
          <RowMenu onEdit={onEdit} onDelete={onDelete} />
        ) : (
          <StatusBadge variant="neutral" size="sm">
            View only
          </StatusBadge>
        )}
      </div>

      <div className="mt-4">
        <ZonePreview
          coordinates={shelf.zone_coordinates}
          label={shelf.shelf_name}
          compact
        />
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-line pt-3.5">
        <StatusBadge variant="healthy" dot size="sm">
          Mapped
        </StatusBadge>

        <span className="font-mono text-[11px] text-ink-subtle">
          ID {shelf.id}
        </span>
      </div>
    </Card>
  );
}

function RowMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <MenuRoot>
      <MenuTrigger
        aria-label="Shelf actions"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-line text-ink-subtle transition-colors duration-200 hover:border-line-strong hover:text-ink"
      >
        <MoreHorizontal className="h-4 w-4" />
      </MenuTrigger>

      <MenuContent>
        <MenuItem onClick={onEdit}>
          <Pencil />
          Edit shelf
        </MenuItem>

        <MenuSeparator />

        <MenuItem tone="critical" onClick={onDelete}>
          <Trash2 />
          Delete shelf
        </MenuItem>
      </MenuContent>
    </MenuRoot>
  );
}
