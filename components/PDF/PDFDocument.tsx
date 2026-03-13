// This file must only be imported dynamically (client-side only)
// Usage: const { PDFDocumentComponent } = await import('@/components/PDF/PDFDocument')

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Project, SiteNode, PageType, Priority } from "@/lib/types";

/* ─── Helpers ─── */

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const TYPE_LABEL: Record<PageType, string> = {
  home: "Accueil",
  listing: "Listing",
  detail: "Détail",
  form: "Formulaire",
  landing: "Landing",
  quiz: "Quiz",
  search: "Recherche",
  error: "Erreur",
  legal: "Légal",
};

const PRIORITY_LABEL: Record<Priority, string> = {
  primary: "Principale",
  secondary: "Secondaire",
  utility: "Utilitaire",
};

const PRIORITY_COLOR: Record<Priority, string> = {
  primary: "#16a34a",
  secondary: "#d97706",
  utility: "#6b7280",
};

function getNodePath(node: SiteNode, allNodes: SiteNode[]): SiteNode[] {
  const parentMap = new Map<string, string>();
  for (const n of allNodes) {
    for (const childId of n.children) {
      if (!parentMap.has(childId)) parentMap.set(childId, n.id);
    }
  }
  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));
  const path: SiteNode[] = [];
  let cur: string | undefined = node.id;
  const visited = new Set<string>();
  while (cur && !visited.has(cur)) {
    visited.add(cur);
    const n = nodeMap.get(cur);
    if (n) path.unshift(n);
    cur = parentMap.get(cur);
  }
  return path;
}

/* ─── Styles ─── */

const styles = StyleSheet.create({
  /* Shared */
  page: {
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  /* Cover */
  coverPage: {
    backgroundColor: "#09090b",
    padding: 60,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  coverTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  coverDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  coverAppName: {
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#52525b",
    letterSpacing: 2,
  },
  coverMain: {
    flexDirection: "column",
    gap: 16,
  },
  coverLabel: {
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#52525b",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  coverTitle: {
    fontSize: 32,
    fontFamily: "Helvetica-Bold",
    color: "#fafafa",
    lineHeight: 1.2,
    maxWidth: 460,
  },
  coverMeta: {
    flexDirection: "row",
    gap: 24,
    marginTop: 20,
    alignItems: "center",
  },
  coverMetaItem: {
    flexDirection: "column",
    gap: 4,
  },
  coverMetaLabel: {
    fontSize: 8,
    color: "#52525b",
    letterSpacing: 1,
  },
  coverMetaValue: {
    fontSize: 12,
    fontFamily: "Helvetica",
    color: "#a1a1aa",
  },
  coverAccentLine: {
    height: 2,
    width: 48,
    borderRadius: 1,
    marginBottom: 24,
  },
  coverFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  coverFooterText: {
    fontSize: 9,
    color: "#3f3f46",
  },
  coverNodeCount: {
    fontSize: 9,
    color: "#3f3f46",
  },
  /* Tree page */
  treePage: {
    backgroundColor: "#09090b",
    padding: 0,
    flexDirection: "column",
  },
  treeHeader: {
    paddingHorizontal: 32,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#1f1f23",
  },
  treeHeaderTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#a1a1aa",
    letterSpacing: 1,
  },
  treeHeaderMeta: {
    fontSize: 9,
    color: "#52525b",
    fontFamily: "Helvetica",
  },
  treeImage: {
    flex: 1,
    objectFit: "contain",
    margin: 24,
  },
  /* Node page */
  nodePage: {
    padding: 48,
    flexDirection: "column",
  },
  nodePageHeader: {
    flexDirection: "column",
    marginBottom: 28,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f2",
  },
  nodeBreadcrumb: {
    fontSize: 8,
    color: "#9ca3af",
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  nodeTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  nodeTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#111113",
    flex: 1,
    lineHeight: 1.2,
  },
  nodeBadgesCol: {
    flexDirection: "column",
    gap: 4,
    alignItems: "flex-end",
    minWidth: 80,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  typeBadgeText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  priorityBadgeText: {
    fontSize: 7,
    letterSpacing: 0.3,
  },
  /* Section */
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#9ca3af",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  sectionText: {
    fontSize: 11,
    color: "#374151",
    lineHeight: 1.65,
    fontFamily: "Helvetica",
  },
  /* CTAs */
  ctaList: {
    flexDirection: "column",
    gap: 6,
  },
  ctaItem: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    borderLeftWidth: 2,
  },
  ctaText: {
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  /* Tags */
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  tag: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 3,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  tagText: {
    fontSize: 8,
    fontFamily: "Courier",
    color: "#6b7280",
  },
  /* Page footer */
  pageFooter: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f2",
    paddingTop: 10,
  },
  pageFooterLeft: {
    fontSize: 8,
    color: "#d1d5db",
    fontFamily: "Helvetica",
  },
  pageFooterRight: {
    fontSize: 8,
    color: "#d1d5db",
    fontFamily: "Helvetica",
  },
  /* Node index page */
  indexPage: {
    padding: 48,
    flexDirection: "column",
  },
  indexTitle: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#111113",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f2",
  },
  indexRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#f9fafb",
  },
  indexRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  indexDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 1,
  },
  indexLabel: {
    fontSize: 11,
    color: "#111113",
    fontFamily: "Helvetica",
  },
  indexType: {
    fontSize: 9,
    color: "#9ca3af",
    fontFamily: "Helvetica",
  },
  indexPage_: {
    fontSize: 9,
    color: "#d1d5db",
    fontFamily: "Helvetica",
  },
});

/* ─── Sub-components ─── */

function NodeFooter({ project, node, pageNum, totalPages }: {
  project: Project;
  node: SiteNode;
  pageNum: number;
  totalPages: number;
}) {
  return (
    <View style={styles.pageFooter}>
      <Text style={styles.pageFooterLeft}>
        {project.name} · {project.version} · {project.client}
      </Text>
      <Text style={styles.pageFooterRight}>
        {node.label} · {pageNum} / {totalPages}
      </Text>
    </View>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

function NodeDetailPage({
  node,
  project,
  pageNum,
  totalPages,
}: {
  node: SiteNode;
  project: Project;
  pageNum: number;
  totalPages: number;
}) {
  const accent = project.accent;
  const path = getNodePath(node, project.nodes);
  const breadcrumb = path.length > 1
    ? path.slice(0, -1).map((n) => n.label).join(" › ")
    : null;

  return (
    <Page size="A4" style={[styles.page, styles.nodePage]}>
      {/* Header */}
      <View style={styles.nodePageHeader}>
        {breadcrumb && (
          <Text style={styles.nodeBreadcrumb}>{breadcrumb} ›</Text>
        )}
        <View style={styles.nodeTitleRow}>
          <Text style={styles.nodeTitle}>{node.label}</Text>
          <View style={styles.nodeBadgesCol}>
            <View style={[styles.typeBadge, { backgroundColor: hexToRgba(accent, 0.1) }]}>
              <Text style={[styles.typeBadgeText, { color: accent }]}>
                {TYPE_LABEL[node.type]}
              </Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: hexToRgba(PRIORITY_COLOR[node.priority], 0.1) }]}>
              <Text style={[styles.priorityBadgeText, { color: PRIORITY_COLOR[node.priority] }]}>
                {PRIORITY_LABEL[node.priority]}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Description */}
      <Section label="Description">
        <Text style={styles.sectionText}>{node.description}</Text>
      </Section>

      {/* Rationale */}
      {node.rationale && (
        <Section label="Rationale">
          <Text style={styles.sectionText}>{node.rationale}</Text>
        </Section>
      )}

      {/* Notes */}
      {node.notes && (
        <Section label="Notes UX">
          <Text style={styles.sectionText}>{node.notes}</Text>
        </Section>
      )}

      {/* CTAs */}
      {node.cta && node.cta.length > 0 && (
        <Section label="CTAs principaux">
          <View style={styles.ctaList}>
            {node.cta.map((cta, i) => (
              <View key={i} style={[styles.ctaItem, { backgroundColor: hexToRgba(accent, 0.06), borderLeftColor: accent }]}>
                <Text style={[styles.ctaText, { color: accent }]}>{cta}</Text>
              </View>
            ))}
          </View>
        </Section>
      )}

      {/* Tags */}
      {node.tags && node.tags.length > 0 && (
        <Section label="Tags">
          <View style={styles.tagRow}>
            {node.tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </Section>
      )}

      {/* Estimate */}
      {node.estimate && (
        <Section label="Estimation">
          <Text style={styles.sectionText}>{node.estimate} heure{node.estimate > 1 ? "s" : ""} de design</Text>
        </Section>
      )}

      <NodeFooter project={project} node={node} pageNum={pageNum} totalPages={totalPages} />
    </Page>
  );
}

/* ─── Main document ─── */

export interface PDFDocumentProps {
  project: Project;
  treeImageDataUrl: string;
}

export function PDFDocumentComponent({ project, treeImageDataUrl }: PDFDocumentProps) {
  const accent = project.accent;
  const formattedDate = new Date(project.date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Primary nodes first for the index
  const primaryNodes = project.nodes.filter((n) => n.priority === "primary");
  const secondaryNodes = project.nodes.filter((n) => n.priority !== "primary");
  const orderedNodes = [...primaryNodes, ...secondaryNodes];

  // Page count: cover(1) + tree(1) + index(1) + nodes(N)
  const totalPages = 3 + orderedNodes.length;

  return (
    <Document
      title={project.name}
      author={project.client}
      subject="Arborescence de navigation"
      creator="arbo — outil DA NéNo"
    >
      {/* ── Page 1 : Cover ── */}
      <Page size="A4" style={styles.coverPage}>
        {/* Top — app identity */}
        <View style={styles.coverTop}>
          <View style={[styles.coverDot, { backgroundColor: accent }]} />
          <Text style={styles.coverAppName}>ARBO</Text>
        </View>

        {/* Main — project info */}
        <View style={styles.coverMain}>
          <View style={[styles.coverAccentLine, { backgroundColor: accent }]} />
          <Text style={styles.coverLabel}>Arborescence de navigation</Text>
          <Text style={styles.coverTitle}>{project.name}</Text>
          <View style={styles.coverMeta}>
            <View style={styles.coverMetaItem}>
              <Text style={styles.coverMetaLabel}>CLIENT</Text>
              <Text style={styles.coverMetaValue}>{project.client}</Text>
            </View>
            <View style={[styles.coverMetaItem, { paddingLeft: 24, borderLeftWidth: 1, borderLeftColor: "#27272a" }]}>
              <Text style={styles.coverMetaLabel}>VERSION</Text>
              <Text style={[styles.coverMetaValue, { color: accent }]}>{project.version}</Text>
            </View>
            <View style={[styles.coverMetaItem, { paddingLeft: 24, borderLeftWidth: 1, borderLeftColor: "#27272a" }]}>
              <Text style={styles.coverMetaLabel}>DATE</Text>
              <Text style={styles.coverMetaValue}>{formattedDate}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.coverFooter}>
          <Text style={styles.coverFooterText}>Document confidentiel — usage interne</Text>
          <Text style={styles.coverNodeCount}>{project.nodes.length} pages · {primaryNodes.length} primaires</Text>
        </View>
      </Page>

      {/* ── Page 2 : Tree screenshot ── */}
      <Page size="A4" orientation="landscape" style={styles.treePage}>
        <View style={styles.treeHeader}>
          <Text style={styles.treeHeaderTitle}>VUE ARBORESCENCE</Text>
          <Text style={styles.treeHeaderMeta}>
            {project.name} · {project.version}
          </Text>
        </View>
        <Image src={treeImageDataUrl} style={styles.treeImage} />
      </Page>

      {/* ── Page 3 : Index ── */}
      <Page size="A4" style={[styles.page, styles.indexPage]}>
        <Text style={styles.indexTitle}>Index des pages</Text>
        {orderedNodes.map((node, i) => {
          const dotColor = node.priority === "primary"
            ? accent
            : node.priority === "secondary"
            ? "#9ca3af"
            : "#d1d5db";
          return (
            <View key={node.id} style={styles.indexRow}>
              <View style={styles.indexRowLeft}>
                <View style={[styles.indexDot, { backgroundColor: dotColor }]} />
                <Text style={styles.indexLabel}>{node.label}</Text>
                <Text style={styles.indexType}>{TYPE_LABEL[node.type]}</Text>
              </View>
              <Text style={styles.indexPage_}>p. {i + 4}</Text>
            </View>
          );
        })}
        {/* Footer */}
        <View style={[styles.pageFooter]}>
          <Text style={styles.pageFooterLeft}>{project.name} · {project.version}</Text>
          <Text style={styles.pageFooterRight}>3 / {totalPages}</Text>
        </View>
      </Page>

      {/* ── Pages 4..N : One page per node ── */}
      {orderedNodes.map((node, i) => (
        <NodeDetailPage
          key={node.id}
          node={node}
          project={project}
          pageNum={i + 4}
          totalPages={totalPages}
        />
      ))}
    </Document>
  );
}
