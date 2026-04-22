import { expect, Page, test } from '@playwright/test';

type ProjectRecord = {
  id: number;
  projectSlug: string;
  projectName: string;
  projectDescription?: string;
  measurementId?: string;
};

type ProjectSettingRecord = {
  projectSlug: string;
  projectName: string;
  projectDescription?: string;
  measurementId?: string;
  authenticationSettings: {
    username: string;
    password: string;
  };
  browserSettings: {
    browser: string[];
    headless: boolean;
  };
  applicationSettings: {
    websiteUrl: string;
    localStorage: {
      data: Array<{ key: string; value: string }>;
    };
    cookie: {
      data: Array<{ key: string; value: string }>;
    };
    gtm: {
      isAccompanyMode: boolean;
      isRequestCheck: boolean;
      tagManagerUrl: string;
      gtmPreviewModeUrl: string;
    };
  };
};

const EXISTING_PROJECT: ProjectRecord = {
  id: 1,
  projectSlug: 'existing-project',
  projectName: 'Existing Project',
  projectDescription: 'Loaded from mocked metadata',
  measurementId: 'G-EXISTING'
};

function createProjectSettings(project: ProjectRecord): ProjectSettingRecord {
  return {
    projectSlug: project.projectSlug,
    projectName: project.projectName,
    projectDescription: project.projectDescription,
    measurementId: project.measurementId,
    authenticationSettings: {
      username: '',
      password: ''
    },
    browserSettings: {
      browser: ['chromium'],
      headless: true
    },
    applicationSettings: {
      websiteUrl: 'https://example.com',
      localStorage: {
        data: []
      },
      cookie: {
        data: []
      },
      gtm: {
        isAccompanyMode: false,
        isRequestCheck: true,
        tagManagerUrl: '',
        gtmPreviewModeUrl: ''
      }
    }
  };
}

// #region API mocks
async function installApiMocks(
  page: Page,
  options?: {
    initialProjects?: ProjectRecord[];
  }
): Promise<void> {
  let projects = options?.initialProjects ?? [EXISTING_PROJECT];

  await page.route('http://localhost:7070/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;
    const method = request.method();

    if (method === 'GET' && pathname === '/projects') {
      await route.fulfill(jsonResponse(projects));
      return;
    }

    if (method === 'POST' && pathname.startsWith('/projects/init-project/')) {
      const payload = (request.postDataJSON() ?? {}) as Partial<ProjectRecord>;
      const pathProjectSlug = pathname.split('/').pop() ?? 'new-project';
      const projectSlug = payload.projectSlug ?? pathProjectSlug;

      if (payload.projectSlug && payload.projectSlug !== pathProjectSlug) {
        throw new Error(
          `Project slug mismatch between request body and path: ${payload.projectSlug} !== ${pathProjectSlug}`
        );
      }

      const createdProject: ProjectRecord = {
        id: projects.length + 1,
        projectSlug,
        projectName: payload.projectName ?? 'New Project',
        projectDescription: payload.projectDescription ?? '',
        measurementId: payload.measurementId ?? ''
      };

      projects = [createdProject, ...projects];
      await route.fulfill(jsonResponse(createdProject));
      return;
    }

    if (method === 'GET' && pathname === '/configurations/rootProjectPath') {
      await route.fulfill(
        jsonResponse({
          id: 1,
          name: 'rootProjectPath',
          value: 'C:/tmp/tag-check-projects'
        })
      );
      return;
    }

    if (method === 'GET' && pathname.startsWith('/settings/')) {
      const projectSlug = pathname.split('/').pop() ?? '';
      const currentProject =
        projects.find((project) => project.projectSlug === projectSlug) ??
        EXISTING_PROJECT;

      await route.fulfill(jsonResponse(createProjectSettings(currentProject)));
      return;
    }

    if (method === 'GET' && pathname.startsWith('/reports/')) {
      await route.fulfill(jsonResponse([]));
      return;
    }

    if (method === 'GET' && pathname.startsWith('/recordings/')) {
      await route.fulfill(jsonResponse([]));
      return;
    }

    throw new Error(`Unhandled mocked API request: ${method} ${pathname}`);
  });
}

function jsonResponse(body: unknown) {
  return {
    status: 200,
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'access-control-allow-headers': '*'
    },
    contentType: 'application/json',
    body: JSON.stringify(body)
  };
}
// #endregion

// #region journeys
test('loads the home page and opens the init-project flow', async ({
  page
}) => {
  await installApiMocks(page);

  await page.goto('/');

  await expect(page.getByText('Existing Project')).toBeVisible();
  await page.locator('#new-project-button').click();

  await expect(page).toHaveURL(/\/init-project$/);
  await expect(page.getByText('New Project')).toBeVisible();
});

test('generates a slug and shows validation feedback for invalid project names', async ({
  page
}) => {
  await installApiMocks(page);

  await page.goto('/init-project');

  const projectNameInput = page.locator('#init-form-project-name');
  const projectSlugInput = page.locator('#init-form-project-slug');

  await projectNameInput.fill('Bad@Name');
  await projectNameInput.blur();

  await expect(page.getByText('Can only have:')).toBeVisible();

  await projectNameInput.fill('Corporate Website Project');

  await expect(projectSlugInput).toHaveValue(
    /^corporate-website-project-[a-z0-9]{4}$/
  );
});

test('submits a new project and redirects to the project workspace', async ({
  page
}) => {
  await installApiMocks(page, {
    initialProjects: [EXISTING_PROJECT]
  });

  await page.goto('/init-project');

  await page.locator('#init-form-project-name').fill('Test Project');
  await page.locator('#init-form-measurement-id').fill('G-TEST1234');
  await page
    .locator('#init-form-project-description')
    .fill('Project created by Playwright');

  const projectSlugInput = page.locator('#init-form-project-slug');
  await expect(projectSlugInput).toHaveValue(/^test-project-[a-z0-9]{4}$/);

  await page.locator('#init-form-submit-btn').click();

  await expect(page).toHaveURL(/\/projects\/test-project-[a-z0-9]{4}$/);
  await expect(page.getByText('Tests')).toBeVisible();
  await expect(
    page.getByRole('columnheader', { name: 'Actions' })
  ).toBeVisible();

  await page
    .locator('app-toolbar')
    .last()
    .locator('span', { hasText: 'TagCheck' })
    .click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText('Test Project')).toBeVisible();
  await expect(page.getByText('Existing Project')).toBeVisible();
});
// #endregion
