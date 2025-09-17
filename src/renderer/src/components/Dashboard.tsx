import { motion } from "framer-motion";
import { Button } from "@/components/ui/button.tsx";
import { Cloud, Plus } from "lucide-react";
import { DashboardProgressBar } from "@/components/ProgressBar";

export function Dashboard() {
  const ipcHandle = (): void => window.electron.ipcRenderer.send("ping");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-1 space-y-5"
    >
      <section>
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-8 text-white">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Your Creative Files</h2>
              <p className="max-w-[600px] text-white/80">
                Access, manage, and share all your design files in one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                className="rounded-2xl bg-white/20 backdrop-blur-md hover:bg-white/30"
                onClick={ipcHandle}
              >
                <Cloud className="mr-2 h-4 w-4" />
                Cloud Storage
              </Button>
              <Button className="rounded-2xl bg-white text-blue-700 hover:bg-white/90">
                <Plus className="mr-2 h-4 w-4" />
                Upload Files
              </Button>
            </div>
          </div>
        </div>
      </section>
      <button className="group relative">
        <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-rose-600 via-red-500 to-orange-500 opacity-30 blur-lg transition-all duration-500 group-hover:opacity-70 group-hover:blur-xl"></div>

        <div className="relative rounded-lg border border-white/10 bg-gradient-to-b from-gray-900 via-gray-950 to-black px-8 py-4 shadow-xl">
          <div className="absolute inset-x-0 top-px h-px bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
          <div className="absolute inset-x-0 bottom-px h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>

          <div className="relative flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative flex h-12 w-12 items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-rose-500/20 border-t-rose-500 transition-transform duration-1000 group-hover:rotate-180"></div>
                <div className="absolute inset-[3px] rounded-full bg-gray-950"></div>
                <span className="relative text-sm font-bold text-rose-500">
                  L24
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white">
                    PLAYER.IO
                  </span>
                  <div className="h-1.5 w-1.5 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50"></div>
                </div>

                <DashboardProgressBar value={67} />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10">
                <svg
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4 text-rose-500"
                >
                  <path
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  ></path>
                </svg>
                <div className="absolute inset-0 rounded-lg bg-rose-500/10 blur-sm transition-all duration-300 group-hover:blur-md"></div>
              </div>

              <span className="text-sm font-semibold text-white">READY</span>

              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-orange-500/40 transition-all duration-300 group-hover:bg-orange-500"></div>
                <div className="h-2 w-2 rounded-full bg-orange-500/40 transition-all duration-300 group-hover:bg-orange-500 group-hover:delay-75"></div>
                <div className="h-2 w-2 rounded-full bg-orange-500/40 transition-all duration-300 group-hover:bg-orange-500 group-hover:delay-150"></div>
              </div>
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  );
}
