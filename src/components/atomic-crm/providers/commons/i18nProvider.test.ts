import { afterEach, describe, expect, it, vi } from "vitest";
import { getInitialLocale, i18nProvider } from "./i18nProvider";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("i18nProvider", () => {
  it("registers en, fr and pt-BR locales", () => {
    expect(i18nProvider.getLocales?.()).toEqual([
      { locale: "en", name: "English" },
      { locale: "fr", name: "Français" },
      { locale: "pt-BR", name: "Português (Brasil)" },
    ]);
  });

  it("translates crm and react-admin keys in brazilian portuguese", async () => {
    await i18nProvider.changeLocale("pt-BR");

    expect(i18nProvider.translate("crm.language")).toBe("Idioma");
    expect(i18nProvider.translate("ra.action.save")).toBe("Salvar");
    expect(i18nProvider.translate("ra-supabase.auth.forgot_password")).toBe(
      "Esqueceu a senha?",
    );
  });

  it("uses browser portuguese locale when available", () => {
    vi.stubGlobal("navigator", {
      language: "pt-BR",
      languages: ["pt-BR", "en-US"],
    });

    expect(getInitialLocale()).toBe("pt-BR");
  });

  it("translates the language key in french", async () => {
    await i18nProvider.changeLocale("fr");

    expect(i18nProvider.translate("crm.language")).toBe("Langue");
  });

  it("falls back to english for unknown locales", async () => {
    await i18nProvider.changeLocale("es");

    expect(i18nProvider.translate("crm.language")).toBe("Language");
  });

  it("uses customized password reset overrides for en and fr", async () => {
    await i18nProvider.changeLocale("en");
    expect(i18nProvider.translate("ra-supabase.auth.password_reset")).toBe(
      "Check your emails for a Reset Password message.",
    );

    await i18nProvider.changeLocale("fr");
    expect(i18nProvider.translate("ra-supabase.auth.password_reset")).toBe(
      "Consultez vos emails pour trouver le message de reinitialisation du mot de passe.",
    );
  });

  it("translates recently added fr crm keys", async () => {
    await i18nProvider.changeLocale("fr");

    expect(i18nProvider.translate("resources.deals.empty.title")).toBe(
      "Aucune affaire trouvée",
    );
  });

  it("uses browser french locale when available", () => {
    vi.stubGlobal("navigator", {
      language: "fr-FR",
      languages: ["fr-FR", "en-US"],
    });

    expect(getInitialLocale()).toBe("fr");
  });

  it("falls back to english when browser locale is unsupported", () => {
    vi.stubGlobal("navigator", {
      language: "es-ES",
      languages: ["es-ES", "de-DE"],
    });

    expect(getInitialLocale()).toBe("en");
  });
});
