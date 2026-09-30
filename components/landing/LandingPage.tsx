import Image from "next/image";
import Link from "next/link";
import hero from "@/app/img/heroe site fomebrava.png";
import footerMentel from "@/app/img/footer-mentel.png";
import { FloatingFoodHero, type FloatingImage } from "@/components/landing/FloatingFoodHero";
import { Marquee } from "@/components/landing/Marquee";
import { InstagramButton } from "@/components/landing/InstagramButton";
import { LandingForm } from "@/components/landing/LandingForm";
import { PhoneScrollHero } from "@/components/landing/PhoneScrollHero";

const flowSteps = [
  {
    title: "Planejar a campanha",
    text: "O clube define o que vai vender e como a arrecadação vai funcionar.",
  },
  {
    title: "Cadastrar os produtos",
    text: "Cada item entra no cardápio, com nome e preço.",
  },
  {
    title: "Vender",
    text: "A pessoa escolhe no celular. No balcão, a venda também pode ser registrada.",
  },
  {
    title: "Receber o pagamento",
    text: "O pagamento é feito por QR Code Pix ou cartão de crédito. O pedido só segue para a cozinha depois da confirmação.",
  },
  {
    title: "Produzir na cozinha",
    text: "A cozinha vê o pedido e prepara, do recebido até o pronto.",
  },
  {
    title: "Entregar",
    text: "Quem pediu retira quando o pedido está pronto.",
  },
  {
    title: "Acompanhar os resultados",
    text: "O clube vê o que vendeu e o que entrou na campanha.",
  },
];

const floatingFoods: FloatingImage[] = [
  {
    src: "https://cdn.21st.dev/assets/mirror/cc/cc7d7fbb538d93322e189b55ae4c6eed95aab7da267a9a095b39216070ef65b0.png",
    alt: "Lanche",
    className: "w-28 sm:w-40 md:w-52 top-6 left-2 sm:left-8 md:top-10 md:left-16 animate-float",
  },
  {
    src: "https://cdn.21st.dev/assets/mirror/95/95bc0d9d69e76d3729ca42f9525bafd449fd27fa41c9393d1deccb85d79b0639.png",
    alt: "Doce",
    className: "w-24 sm:w-32 md:w-40 top-4 right-2 sm:right-8 md:top-8 md:right-14 animate-float",
  },
  {
    src: "https://cdn.21st.dev/assets/mirror/6e/6e4600ac05444d9dc0396906da4174dcfe42a64c14082d939f0f57cb2ed8113d.png",
    alt: "Pizza",
    className: "w-24 sm:w-36 md:w-48 bottom-16 right-2 sm:right-10 md:bottom-20 md:right-16 animate-float",
  },
  {
    src: "https://cdn.21st.dev/assets/mirror/8e/8ec4fbab8445c1769d3200d674cd3731a0550b21c87bb8bc6938cb3a05932e5b.png",
    alt: "",
    className: "w-8 sm:w-12 top-1/4 left-1/3 animate-float",
  },
  {
    src: "https://cdn.21st.dev/assets/mirror/e7/e758e9c35a8360f201c40d0bf3e3433c2b6ff3f759763eb697cbc3803af80e18.png",
    alt: "",
    className: "w-8 sm:w-10 top-1/2 right-1/4 animate-float",
  },
];

export function LandingPage() {
  return (
    <div className="relative min-h-screen bg-brand-paper text-black">
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <Image
          src={hero}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-brand-paper/55" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-brand-paper/25 to-brand-paper" />
      </div>

      <div className="relative z-30 bg-white">
        <Marquee aria-hidden>
          {Array.from({ length: 8 }, (_, index) => (
            <span key={index} className="mx-8 flex shrink-0 items-center gap-3 whitespace-nowrap">
              <Image src="/logo.png" alt="" width={36} height={36} className="shrink-0 rounded-md" />
              <span
                className="whitespace-nowrap text-2xl font-bold tracking-tight text-black"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                fomebrava
              </span>
            </span>
          ))}
        </Marquee>
      </div>

      <header className="relative z-20 mx-auto flex max-w-5xl items-center px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Fomebrava" width={48} height={48} priority className="rounded-md" />
        </Link>
      </header>

      <main className="relative z-10">
        <FloatingFoodHero
          title="Assistente para campanhas de arrecadação dos Desbravadores."
          photo={hero}
          images={floatingFoods}
        />

        <PhoneScrollHero titleComponent={null} overlap={0}>
          <img
            src="/landing/acompanhamento.png"
            alt="Tela real de acompanhamento do pedido no Fomebrava, com a senha, as etapas e os itens"
            className="absolute inset-x-0 top-7 h-[calc(100%-1.75rem)] w-full bg-brand-paper object-contain object-top"
          />
        </PhoneScrollHero>

        <section className="relative z-20 mx-auto max-w-lg px-4 pb-8 pt-8">
          <ol className="space-y-8 border-l border-brand-navy/25 pl-6">
            {flowSteps.map((step) => (
              <li key={step.title} className="relative">
                <span
                  aria-hidden
                  className="absolute -left-[1.95rem] top-1.5 h-3 w-3 rounded-full border-2 border-brand-orange bg-white"
                />
                <h2 className="text-base font-bold text-brand-navy">{step.title}</h2>
                <p className="mt-1 text-sm leading-6 text-neutral-700">{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="relative z-20 px-4 pb-24">
          <div className="mx-auto max-w-lg rounded-md border border-neutral-200 bg-white/90 p-6 shadow-sm backdrop-blur-sm sm:p-8">
            <h2 className="text-2xl font-bold text-brand-navy">Solicite acesso ao Fomebrava</h2>
            <p className="mt-3 text-sm leading-6 text-neutral-700">
              O Fomebrava é uma ferramenta exclusiva para Clubes de Desbravadores.
            </p>
            <p className="mt-3 text-sm leading-6 text-neutral-700">
              Preencha os dados abaixo para solicitar acesso. Antes da liberação, faremos uma breve
              validação para confirmar seu vínculo com um clube.
            </p>
            <p className="mt-3 mb-6 text-sm font-bold leading-6 text-black">
              O acesso é concedido somente a membros de clubes elegíveis após a validação.
            </p>
            <LandingForm />
          </div>
        </section>
      </main>

      <footer className="relative z-20 bg-black">
        <Image
          src={footerMentel}
          alt="Mentel Soluções Digitais. Soluções digitais para o seu crescimento. Tecnologia, pessoas, resultados."
          className="mx-auto h-auto w-full max-w-6xl"
        />
      </footer>

      <InstagramButton />
    </div>
  );
}
