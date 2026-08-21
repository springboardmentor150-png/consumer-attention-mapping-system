"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  createStore,
  getStores,
  updateStore,
  deleteStore,
} from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { AccentIcon } from "@/components/ui/AccentIcon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/Field";
import { SearchInput } from "@/components/SearchInput";
import { Pagination } from "@/components/Pagination";
import { TableState } from "@/components/TableState";
import { AccessDenied } from "@/components/AccessDenied";
import { EmptyState } from "@/components/ui/EmptyState";
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
  ArrowRight,
  Building2,
  LayoutGrid,
  MapPin,
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

type SortKey = "id" | "name" | "location";
type ViewMode = "grid" | "table";

const PAGE_SIZE = 9;

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  // null until the stored role has been read, so the guard below never flashes
  // Access Denied at a user who is actually permitted.
  const [role, setRole] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteError, setDeleteError] = useState("");
  const [saving, setSaving] = useState(false);

  // Presentation only. Cards read better for a small estate, the table for
  // a long one, so both are offered and the choice is remembered per visit.
  const [view, setView] = useState<ViewMode>("grid");
  const [sort, setSort] = useState<{ key: SortKey; direction: "asc" | "desc" }>({
    key: "id",
    direction: "asc",
  });

  async function loadStores() {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    setLoading(true);

    try {
      const data = await getStores(token);
      setStores(data);
      setDeleteError("");
    } catch (error) {
      console.error(error);
      setStores([]);
      setDeleteError("Could not load stores.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setRole(localStorage.getItem("role") || "");
  }, []);

  useEffect(() => {
    if (role === null) return;

    // Don't call the store endpoint at all for a role the API would reject.
    if (!can(role, "viewStores")) {
      setLoading(false);
      return;
    }

    loadStores();
  }, [role]);

  const filteredStores = useMemo(() => {
    const query = search.trim().toLowerCase();

    const matched = !query
      ? stores
      : stores.filter(
          (store) =>
            store.name.toLowerCase().includes(query) ||
            store.location.toLowerCase().includes(query)
        );

    const direction = sort.direction === "asc" ? 1 : -1;

    return [...matched].sort((a, b) => {
      if (sort.key === "id") return (a.id - b.id) * direction;

      return a[sort.key].localeCompare(b[sort.key]) * direction;
    });
  }, [stores, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredStores.length / PAGE_SIZE));

  const paginatedStores = filteredStores.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  function toggleSort(key: SortKey) {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) return;

    setSaving(true);

    try {
      if (editingId === null) {
        await createStore(name, location, token);
      } else {
        await updateStore(editingId, name, location, token);
        setEditingId(null);
      }

      setName("");
      setLocation("");

      await loadStores();
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(store: Store) {
    setEditingId(store.id);
    setName(store.name);
    setLocation(store.location);

    // The form sits at the top of the page; bring it into view so an edit
    // started from a row lower down does not look like a no-op.
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setLocation("");
  }

  async function handleDelete(id: number) {
    const token = localStorage.getItem("token");

    if (!token) return;

    if (!confirm("Delete this store?")) return;

    setDeleteError("");

    try {
      await deleteStore(id, token);
      await loadStores();
    } catch (error) {
      console.error(error);
      setDeleteError(
        error instanceof Error ? error.message : "Could not delete store."
      );
    }
  }

  if (role === null) {
    return null;
  }

  if (!can(role, "viewStores")) {
    return <AccessDenied role={role} />;
  }

  const canManage = can(role, "manageStores");

  return (
    <>
      <PageHeader
        title="Store Management"
        subtitle={
          canManage
            ? "View and manage every retail location monitored by the platform."
            : "Browse every retail location monitored by the platform."
        }
        eyebrow={
          <>
            <StatusBadge variant="analytics" dot>
              {stores.length} {stores.length === 1 ? "location" : "locations"}
            </StatusBadge>

            {!canManage && (
              <StatusBadge variant="neutral" outline>
                Read only
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
                      ? "bg-brand-soft text-brand-deep"
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
              placeholder="Search stores…"
              className="w-full sm:w-64"
            />
          </>
        }
      />

      {/* ── Create / edit ─────────────────────────────────────────────── */}
      {canManage && (
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
            title={editingId === null ? "Add a store" : "Edit store"}
            description={
              editingId === null
                ? "Register a new retail location so its shelves and cameras can be configured."
                : `Updating store #${editingId}. Save to apply, or cancel to leave it unchanged.`
            }
            action={
              editingId !== null ? (
                <Button variant="ghost" size="sm" onClick={cancelEdit}>
                  <X />
                  Cancel
                </Button>
              ) : undefined
            }
          />

          <form
            onSubmit={handleSubmit}
            className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
          >
            <Field label="Store name" required>
              {(id) => (
                <Input
                  id={id}
                  placeholder="Riverside Flagship"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  icon={StoreIcon}
                  required
                />
              )}
            </Field>

            <Field label="Location" required>
              {(id) => (
                <Input
                  id={id}
                  placeholder="Bengaluru, KA"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  icon={MapPin}
                  required
                />
              )}
            </Field>

            <Button type="submit" size="lg" loading={saving} className="md:mb-0">
              {!saving && (editingId === null ? <Plus /> : <Pencil />)}
              {editingId === null ? "Add store" : "Update store"}
            </Button>
          </form>
        </Card>
      )}

      {deleteError && (
        <div
          role="alert"
          className="animate-fade-in mb-5 flex items-start gap-2.5 rounded-xl border border-critical-soft bg-critical-soft/40 px-4 py-3 text-sm text-critical-strong"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {deleteError}
        </div>
      )}

      {/* ── Records ───────────────────────────────────────────────────── */}
      <TableToolbar
        className="mb-4"
        count={
          <>
            <span className="font-medium text-ink">
              {filteredStores.length}
            </span>{" "}
            {filteredStores.length === 1 ? "store" : "stores"}
            {search && " matching your search"}
          </>
        }
      />

      {view === "grid" ? (
        loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <Card key={index} className="h-44 animate-pulse bg-surface-sunken" />
            ))}
          </div>
        ) : paginatedStores.length === 0 ? (
          <Card className="p-5">
            <EmptyState
              icon={Building2}
              title={search ? "No stores match your search" : "No stores yet"}
              description={
                search
                  ? "Try a different name or location."
                  : canManage
                    ? "Add your first retail location to start mapping shopper attention."
                    : "No retail locations have been registered yet."
              }
              variant="analytics"
              action={
                search ? (
                  <Button variant="outline" size="sm" onClick={() => setSearch("")}>
                    Clear search
                  </Button>
                ) : undefined
              }
            />
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {paginatedStores.map((store, index) => (
              <StoreCard
                key={store.id}
                store={store}
                canManage={canManage}
                onEdit={() => handleEdit(store)}
                onDelete={() => handleDelete(store.id)}
                delay={index * 45}
              />
            ))}
          </div>
        )
      ) : (
        <Card className="overflow-hidden">
          <TableShell>
            <THead>
              <TH
                sortable
                active={sort.key === "id"}
                direction={sort.direction}
                onSort={() => toggleSort("id")}
              >
                ID
              </TH>

              <TH
                sortable
                active={sort.key === "name"}
                direction={sort.direction}
                onSort={() => toggleSort("name")}
              >
                Store name
              </TH>

              <TH
                sortable
                active={sort.key === "location"}
                direction={sort.direction}
                onSort={() => toggleSort("location")}
              >
                Location
              </TH>

              <TH align="right">Actions</TH>
            </THead>

            <tbody>
              {loading ? (
                <TableState colSpan={4} loading icon={StoreIcon} message="" />
              ) : paginatedStores.length === 0 ? (
                <TableState
                  colSpan={4}
                  loading={false}
                  icon={Building2}
                  message={
                    search ? "No stores match your search" : "No stores yet"
                  }
                  description={
                    search
                      ? "Try a different name or location."
                      : "Registered locations will appear here."
                  }
                  variant="analytics"
                />
              ) : (
                paginatedStores.map((store) => (
                  <TRow key={store.id}>
                    <TD>
                      <IdCell>#{store.id}</IdCell>
                    </TD>

                    <TD>
                      <span className="flex items-center gap-2.5">
                        <AccentIcon
                          icon={StoreIcon}
                          variant="analytics"
                          size="sm"
                        />
                        <span className="font-medium text-ink">
                          {store.name}
                        </span>
                      </span>
                    </TD>

                    <TD>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin
                          className="h-3.5 w-3.5 text-ink-subtle"
                          aria-hidden="true"
                        />
                        {store.location}
                      </span>
                    </TD>

                    <TD align="right">
                      {canManage ? (
                        <RowMenu
                          onEdit={() => handleEdit(store)}
                          onDelete={() => handleDelete(store.id)}
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

      {view === "grid" && !loading && (
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

function StoreCard({
  store,
  canManage,
  onEdit,
  onDelete,
  delay,
}: {
  store: Store;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  delay: number;
}) {
  return (
    <Card
      glow="analytics"
      className="animate-rise-in stagger flex flex-col p-5"
      style={{ ["--delay" as string]: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <AccentIcon icon={StoreIcon} variant="analytics" size="lg" solid />

        {canManage ? (
          <RowMenu onEdit={onEdit} onDelete={onDelete} />
        ) : (
          <StatusBadge variant="neutral" size="sm">
            View only
          </StatusBadge>
        )}
      </div>

      <h3 className="mt-4 truncate font-display text-base font-semibold text-ink">
        {store.name}
      </h3>

      <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-ink-muted">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-subtle" aria-hidden="true" />
        {store.location}
      </p>

      <div className="mt-4 flex items-center gap-2">
        <StatusBadge variant="healthy" dot size="sm">
          Monitored
        </StatusBadge>

        <span className="font-mono text-[11px] text-ink-subtle">
          ID {store.id}
        </span>
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-line pt-4">
        <Button
          render={<Link href="/shelves" />}
          variant="ghost"
          size="sm"
          className="group/link -ml-1"
        >
          <LayoutGrid />
          Shelves
          <ArrowRight className="transition-transform duration-200 group-hover/link:translate-x-0.5" />
        </Button>
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
        aria-label="Store actions"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-ink-subtle transition-colors duration-200 hover:border-line-strong hover:text-ink"
      >
        <MoreHorizontal className="h-4 w-4" />
      </MenuTrigger>

      <MenuContent>
        <MenuItem onClick={onEdit}>
          <Pencil />
          Edit details
        </MenuItem>

        <MenuSeparator />

        <MenuItem tone="critical" onClick={onDelete}>
          <Trash2 />
          Delete store
        </MenuItem>
      </MenuContent>
    </MenuRoot>
  );
}
