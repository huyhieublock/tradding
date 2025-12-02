import { useOrderlyConfig } from "@/utils/config";
import { Outlet } from "react-router-dom";
import Header from "./Header";

export default function PerpLayout() {
  const config = useOrderlyConfig();

  return (
    <div>
      <Header />
      <Outlet />
    </div>
  );
}
