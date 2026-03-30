import { getDb } from "@/lib/db";
import { listProjects } from "@/lib/services/projects";
import { getTaskStats } from "@/lib/services/tasks";
import Link from "next/link";

export default function DashboardPage() {
  const db = getDb();
  const projects = listProjects(db);
  const stats = getTaskStats(db);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Overview of your projects and tasks. Press{" "}
            <span className="kbd">Cmd+.</span> to chat with AI or{" "}
            <span className="kbd">Cmd+K</span> for quick actions.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Projects</div>
          <div className="stat-value">{projects.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Tasks</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In Progress</div>
          <div className="stat-value" style={{ color: "var(--color-warning)" }}>
            {stats.inProgress}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value" style={{ color: "var(--color-success)" }}>
            {stats.done}
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>
        Recent Projects
      </h2>
      <div className="card-grid">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            style={{ textDecoration: "none" }}
          >
            <div className="card project-card">
              <div className="project-card-name">{project.name}</div>
              <div className="project-card-desc">
                {project.description || "No description"}
              </div>
              <div className="project-card-footer">
                <span className={`badge badge-${project.status}`}>
                  {project.status}
                </span>
                <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
