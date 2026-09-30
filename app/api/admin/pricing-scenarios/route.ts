import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface SaveScenarioBody {
  nome?: unknown;
  regionId?: unknown;
  totalBudget?: unknown;
  reservePercentage?: unknown;
  fundraisingTarget?: unknown;
  totalPlannedCost?: unknown;
  suggestedRevenue?: unknown;
  inputSnapshot?: unknown;
  resultSnapshot?: unknown;
}

function validMoney(value: unknown, max = 10_000_000): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= max;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, tenant_id")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Acesso restrito a administradores." }, { status: 403 });
  }
  if (!profile.tenant_id) {
    return NextResponse.json({ error: "Usuário sem tenant associado." }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as SaveScenarioBody | null;
  if (!body) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const nome = typeof body.nome === "string" ? body.nome.trim() : "";
  if (nome.length < 3 || nome.length > 120) {
    return NextResponse.json(
      { error: "Dê um nome ao planejamento, entre 3 e 120 caracteres." },
      { status: 400 }
    );
  }
  if (
    !validMoney(body.totalBudget) ||
    !validMoney(body.fundraisingTarget) ||
    !validMoney(body.totalPlannedCost) ||
    !validMoney(body.suggestedRevenue) ||
    typeof body.reservePercentage !== "number" ||
    !Number.isFinite(body.reservePercentage) ||
    body.reservePercentage < 0 ||
    body.reservePercentage > 100
  ) {
    return NextResponse.json({ error: "Valores financeiros inválidos." }, { status: 400 });
  }

  const snapshotSize = JSON.stringify({
    input: body.inputSnapshot,
    result: body.resultSnapshot,
  }).length;
  if (snapshotSize > 150_000) {
    return NextResponse.json({ error: "Planejamento grande demais para salvar." }, { status: 413 });
  }

  const regionId =
    typeof body.regionId === "string" && /^[0-9a-f-]{36}$/i.test(body.regionId)
      ? body.regionId
      : null;

  const { data, error } = await supabase
    .from("pricing_scenarios")
    .insert({
      nome,
      region_id: regionId,
      total_budget: body.totalBudget,
      reserve_percentage: body.reservePercentage,
      fundraising_target: body.fundraisingTarget,
      total_planned_cost: body.totalPlannedCost,
      suggested_revenue: body.suggestedRevenue,
      input_snapshot: body.inputSnapshot ?? {},
      result_snapshot: body.resultSnapshot ?? {},
      created_by: user.id,
      tenant_id: profile.tenant_id,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Erro ao salvar planejamento de precificação:", error);
    return NextResponse.json(
      { error: "Não foi possível salvar. Confirme se a migração 0008 foi aplicada." },
      { status: 400 }
    );
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}

