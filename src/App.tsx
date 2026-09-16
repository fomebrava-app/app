import { AppProvider, useApp } from "./store";
import { Landing } from "./public/Landing";
import { ProductDetail } from "./public/ProductDetail";
import { Checkout } from "./public/Checkout";
import { Login } from "./admin/Login";
import { Overview } from "./admin/Overview";
import { Products } from "./admin/Products";
import { ProductForm } from "./admin/ProductForm";
import { Inventory } from "./admin/Inventory";
import { Finance } from "./admin/Finance";
import { Customers } from "./admin/Customers";
import { PDV } from "./admin/PDV";
import { Settings } from "./admin/Settings";

function Router() {
  const { route } = useApp();

  switch (route.name) {
    case "landing":
      return <Landing />;
    case "product":
      return <ProductDetail id={route.id} />;
    case "checkout":
      return <Checkout />;
    case "login":
      return <Login />;
    case "overview":
      return <Overview />;
    case "products":
      return <Products />;
    case "product-form":
      return <ProductForm id={route.id} />;
    case "inventory":
      return <Inventory />;
    case "finance":
      return <Finance />;
    case "customers":
      return <Customers />;
    case "pdv":
      return <PDV />;
    case "settings":
      return <Settings />;
    default:
      return <Landing />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}
