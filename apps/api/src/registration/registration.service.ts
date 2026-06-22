import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  canJoinWithRegistrationStatus,
  createDefaultRegistrationFormConfig,
  standardFieldColumnKey,
  type RegistrationFormConfig,
  type RegistrationStatus as SharedRegistrationStatus,
} from '@boldmeet/shared';
import {
  Prisma,
  RegistrationFieldType,
  RegistrationStatus,
  StandardRegistrationField,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  SubmitRegistrationDto,
  UpsertRegistrationFormDto,
} from './dto/registration.dto';

@Injectable()
export class RegistrationService {
  constructor(private readonly prisma: PrismaService) {}

  serializeForm(form: {
    id: string;
    meetingId: string;
    requireApproval: boolean;
    autoApprove: boolean;
    sendConfirmationEmail: boolean;
    limitRegistrations: boolean;
    maxRegistrations: number | null;
    fields: Array<{
      id: string;
      fieldKey: string;
      label: string;
      fieldType: RegistrationFieldType;
      standardField: StandardRegistrationField | null;
      isRequired: boolean;
      isEnabled: boolean;
      isLocked: boolean;
      sortOrder: number;
      options: Prisma.JsonValue;
      placeholder: string | null;
      helpText: string | null;
    }>;
  }) {
    return {
      id: form.id,
      meetingId: form.meetingId,
      settings: {
        requireApproval: form.requireApproval,
        autoApprove: form.autoApprove,
        sendConfirmationEmail: form.sendConfirmationEmail,
        limitRegistrations: form.limitRegistrations,
        maxRegistrations: form.maxRegistrations,
      },
      fields: form.fields
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((field) => ({
          id: field.id,
          fieldKey: field.fieldKey,
          label: field.label,
          fieldType: field.fieldType,
          standardField: field.standardField,
          isRequired: field.isRequired,
          isEnabled: field.isEnabled,
          isLocked: field.isLocked,
          sortOrder: field.sortOrder,
          options: Array.isArray(field.options)
            ? (field.options as string[])
            : [],
          placeholder: field.placeholder,
          helpText: field.helpText,
          isCustom: !field.standardField,
        })),
    };
  }

  async getFormForHost(meetingIdOrCode: string, hostId: string) {
    const meeting = await this.resolveMeeting(meetingIdOrCode);
    if (meeting.hostId !== hostId) {
      throw new ForbiddenException(
        'Only the host can manage the registration form',
      );
    }

    let form = await this.prisma.meetingRegistrationForm.findUnique({
      where: { meetingId: meeting.id },
      include: { fields: { orderBy: { sortOrder: 'asc' } } },
    });

    if (!form) {
      form = await this.createDefaultForm(meeting.id);
    }

    return this.serializeForm(form);
  }

  async getPublicForm(meetingIdOrCode: string) {
    const meeting = await this.resolveMeeting(meetingIdOrCode, {
      settings: true,
    });
    const settings = (
      meeting as { settings?: { registrationRequired: boolean } | null }
    ).settings;
    if (!settings?.registrationRequired) {
      throw new BadRequestException(
        'Registration is not required for this meeting',
      );
    }

    const form = await this.prisma.meetingRegistrationForm.findUnique({
      where: { meetingId: meeting.id },
      include: {
        fields: { where: { isEnabled: true }, orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!form) {
      return {
        settings: createDefaultRegistrationFormConfig().settings,
        fields: createDefaultRegistrationFormConfig().fields.filter(
          (f) => f.isEnabled,
        ),
      };
    }

    return this.serializeForm(form);
  }

  async upsertForm(
    meetingIdOrCode: string,
    hostId: string,
    dto: UpsertRegistrationFormDto,
  ) {
    const meeting = await this.resolveMeeting(meetingIdOrCode, {
      settings: true,
    });
    const meetingSettings = (
      meeting as { settings?: { registrationRequired: boolean } | null }
    ).settings;
    if (meeting.hostId !== hostId) {
      throw new ForbiddenException(
        'Only the host can manage the registration form',
      );
    }

    this.validateFormPayload(dto);

    const form = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.meetingRegistrationForm.upsert({
        where: { meetingId: meeting.id },
        create: {
          meetingId: meeting.id,
          requireApproval: dto.settings.requireApproval,
          autoApprove: dto.settings.autoApprove,
          sendConfirmationEmail: dto.settings.sendConfirmationEmail,
          limitRegistrations: dto.settings.limitRegistrations,
          maxRegistrations: dto.settings.limitRegistrations
            ? (dto.settings.maxRegistrations ?? null)
            : null,
        },
        update: {
          requireApproval: dto.settings.requireApproval,
          autoApprove: dto.settings.autoApprove,
          sendConfirmationEmail: dto.settings.sendConfirmationEmail,
          limitRegistrations: dto.settings.limitRegistrations,
          maxRegistrations: dto.settings.limitRegistrations
            ? (dto.settings.maxRegistrations ?? null)
            : null,
        },
      });

      await tx.meetingRegistrationField.deleteMany({
        where: { formId: saved.id },
      });

      await tx.meetingRegistrationField.createMany({
        data: dto.fields.map((field) => ({
          formId: saved.id,
          fieldKey: field.fieldKey,
          label: field.label,
          fieldType: field.fieldType,
          standardField: field.standardField ?? null,
          isRequired: field.isRequired,
          isEnabled: field.isEnabled,
          isLocked: field.isLocked ?? false,
          sortOrder: field.sortOrder,
          options: field.options ?? [],
          placeholder: field.placeholder ?? null,
          helpText: field.helpText ?? null,
        })),
      });

      if (!meetingSettings?.registrationRequired) {
        await tx.meetingSettings.update({
          where: { meetingId: meeting.id },
          data: { registrationRequired: true },
        });
      }

      return tx.meetingRegistrationForm.findUniqueOrThrow({
        where: { id: saved.id },
        include: { fields: { orderBy: { sortOrder: 'asc' } } },
      });
    });

    return this.serializeForm(form);
  }

  async createDefaultForm(meetingId: string, config?: RegistrationFormConfig) {
    const payload = config ?? createDefaultRegistrationFormConfig();

    return this.prisma.meetingRegistrationForm.create({
      data: {
        meetingId,
        requireApproval: payload.settings.requireApproval,
        autoApprove: payload.settings.autoApprove,
        sendConfirmationEmail: payload.settings.sendConfirmationEmail,
        limitRegistrations: payload.settings.limitRegistrations,
        maxRegistrations: payload.settings.maxRegistrations ?? null,
        fields: {
          create: payload.fields.map((field) => ({
            fieldKey: field.fieldKey,
            label: field.label,
            fieldType: field.fieldType,
            standardField:
              (field.standardField as StandardRegistrationField | undefined) ??
              null,
            isRequired: field.isRequired,
            isEnabled: field.isEnabled,
            isLocked: field.isLocked ?? false,
            sortOrder: field.sortOrder,
            options: field.options ?? [],
            placeholder: field.placeholder ?? null,
            helpText: field.helpText ?? null,
          })),
        },
      },
      include: { fields: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async submitRegistration(
    meetingIdOrCode: string,
    dto: SubmitRegistrationDto,
  ) {
    const meeting = await this.resolveMeeting(meetingIdOrCode, {
      settings: true,
    });
    const settings = (
      meeting as { settings?: { registrationRequired: boolean } | null }
    ).settings;
    if (!settings?.registrationRequired) {
      throw new BadRequestException(
        'Registration is not required for this meeting',
      );
    }

    const form = await this.prisma.meetingRegistrationForm.findUnique({
      where: { meetingId: meeting.id },
      include: {
        fields: { where: { isEnabled: true }, orderBy: { sortOrder: 'asc' } },
      },
    });

    const enabledFields = form?.fields ?? [];
    const answers = dto.answers ?? {};

    const standardValues = this.extractStandardValues(
      enabledFields,
      answers,
      dto,
    );
    const email = standardValues.email.trim().toLowerCase();

    if (form?.limitRegistrations && form.maxRegistrations) {
      const count = await this.prisma.meetingRegistration.count({
        where: {
          meetingId: meeting.id,
          status: { not: RegistrationStatus.REJECTED },
        },
      });
      const existing = await this.prisma.meetingRegistration.findUnique({
        where: { meetingId_email: { meetingId: meeting.id, email } },
      });
      if (!existing && count >= form.maxRegistrations) {
        throw new BadRequestException(
          'Registration limit reached for this meeting',
        );
      }
    }

    const requireApproval = form?.requireApproval ?? false;
    const autoApprove = form?.autoApprove ?? true;
    const status =
      requireApproval && !autoApprove
        ? RegistrationStatus.PENDING
        : RegistrationStatus.APPROVED;

    const now = new Date();

    const registration = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.meetingRegistration.upsert({
        where: { meetingId_email: { meetingId: meeting.id, email } },
        create: {
          meetingId: meeting.id,
          formId: form?.id ?? null,
          email,
          fullName: standardValues.fullName,
          phone: standardValues.phone ?? null,
          company: standardValues.company ?? null,
          designation: standardValues.designation ?? null,
          city: standardValues.city ?? null,
          state: standardValues.state ?? null,
          country: standardValues.country ?? null,
          website: standardValues.website ?? null,
          linkedInUrl: standardValues.linkedInUrl ?? null,
          status,
          approvedAt: status === RegistrationStatus.APPROVED ? now : null,
        },
        update: {
          fullName: standardValues.fullName,
          phone: standardValues.phone ?? null,
          company: standardValues.company ?? null,
          designation: standardValues.designation ?? null,
          city: standardValues.city ?? null,
          state: standardValues.state ?? null,
          country: standardValues.country ?? null,
          website: standardValues.website ?? null,
          linkedInUrl: standardValues.linkedInUrl ?? null,
          status:
            status === RegistrationStatus.APPROVED
              ? RegistrationStatus.APPROVED
              : undefined,
          approvedAt: status === RegistrationStatus.APPROVED ? now : undefined,
          rejectedAt: null,
        },
      });

      if (form) {
        await tx.meetingRegistrationAnswer.deleteMany({
          where: { registrationId: saved.id },
        });

        const customAnswers = enabledFields
          .filter((field) => !field.standardField)
          .map((field) => {
            const raw = answers[field.fieldKey];
            const value = Array.isArray(raw)
              ? raw.join(', ')
              : String(raw ?? '').trim();
            return { fieldId: field.id, value };
          })
          .filter((item) => item.value);

        if (customAnswers.length > 0) {
          await tx.meetingRegistrationAnswer.createMany({
            data: customAnswers.map((item) => ({
              registrationId: saved.id,
              fieldId: item.fieldId,
              value: item.value,
            })),
          });
        }
      }

      return saved;
    });

    if (form?.sendConfirmationEmail) {
      console.log('[registration] confirmation email queued', {
        email,
        meetingId: meeting.id,
      });
    }

    return {
      id: registration.id,
      email: registration.email,
      fullName: registration.fullName,
      status: registration.status,
      canJoin: canJoinWithRegistrationStatus(
        registration.status as SharedRegistrationStatus,
      ),
      message:
        registration.status === RegistrationStatus.PENDING
          ? 'Your registration is pending approval.'
          : 'Registration successful. You can join the meeting.',
    };
  }

  async getRegistrationStatus(meetingIdOrCode: string, email: string) {
    const meeting = await this.resolveMeeting(meetingIdOrCode);
    const normalizedEmail = email.trim().toLowerCase();
    const registration = await this.prisma.meetingRegistration.findUnique({
      where: {
        meetingId_email: { meetingId: meeting.id, email: normalizedEmail },
      },
    });

    if (!registration) {
      return { registered: false, canJoin: false, status: null };
    }

    return {
      registered: true,
      canJoin: canJoinWithRegistrationStatus(
        registration.status as SharedRegistrationStatus,
      ),
      status: registration.status,
      fullName: registration.fullName,
    };
  }

  async assertCanJoin(
    meetingId: string,
    email: string | undefined,
    isHost: boolean,
  ) {
    if (isHost || !email) return;

    const registration = await this.prisma.meetingRegistration.findUnique({
      where: {
        meetingId_email: { meetingId, email: email.trim().toLowerCase() },
      },
    });

    if (!registration) {
      throw new ForbiddenException('Email is not registered for this meeting');
    }

    if (registration.status === RegistrationStatus.PENDING) {
      throw new ForbiddenException('Your registration is pending approval');
    }

    if (registration.status === RegistrationStatus.REJECTED) {
      throw new ForbiddenException('Your registration was rejected');
    }

    if (
      !canJoinWithRegistrationStatus(
        registration.status as SharedRegistrationStatus,
      )
    ) {
      throw new ForbiddenException(
        'Registration approval is required before joining',
      );
    }
  }

  async markJoined(meetingId: string, email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    await this.prisma.meetingRegistration.updateMany({
      where: {
        meetingId,
        email: normalizedEmail,
        status: {
          in: [RegistrationStatus.APPROVED, RegistrationStatus.JOINED],
        },
      },
      data: { status: RegistrationStatus.JOINED, joinedAt: new Date() },
    });
  }

  async listRegistrations(meetingIdOrCode: string, hostId: string) {
    const meeting = await this.resolveMeeting(meetingIdOrCode);
    if (meeting.hostId !== hostId) {
      throw new ForbiddenException('Only the host can view registrations');
    }

    const rows = await this.prisma.meetingRegistration.findMany({
      where: { meetingId: meeting.id },
      orderBy: { createdAt: 'desc' },
      include: {
        answers: {
          include: { field: { select: { fieldKey: true, label: true } } },
        },
      },
    });

    return rows.map((row) => ({
      id: row.id,
      fullName: row.fullName,
      email: row.email,
      phone: row.phone,
      company: row.company,
      designation: row.designation,
      city: row.city,
      state: row.state,
      country: row.country,
      website: row.website,
      linkedInUrl: row.linkedInUrl,
      status: row.status,
      createdAt: row.createdAt,
      joinedAt: row.joinedAt,
      customAnswers: row.answers.map((a) => ({
        fieldKey: a.field.fieldKey,
        label: a.field.label,
        value: a.value,
      })),
    }));
  }

  async updateRegistrationStatus(
    meetingIdOrCode: string,
    registrationId: string,
    hostId: string,
    status: RegistrationStatus,
  ) {
    const meeting = await this.resolveMeeting(meetingIdOrCode);
    if (meeting.hostId !== hostId) {
      throw new ForbiddenException('Only the host can update registrations');
    }

    const allowed: RegistrationStatus[] = [
      RegistrationStatus.APPROVED,
      RegistrationStatus.REJECTED,
      RegistrationStatus.PENDING,
    ];
    if (!allowed.includes(status)) {
      throw new BadRequestException('Invalid status update');
    }

    const existing = await this.prisma.meetingRegistration.findFirst({
      where: { id: registrationId, meetingId: meeting.id },
    });
    if (!existing) {
      throw new NotFoundException('Registration not found');
    }

    const now = new Date();
    const updated = await this.prisma.meetingRegistration.update({
      where: { id: registrationId },
      data: {
        status,
        approvedAt: status === RegistrationStatus.APPROVED ? now : undefined,
        rejectedAt: status === RegistrationStatus.REJECTED ? now : undefined,
      },
    });

    return updated;
  }

  async exportRegistrations(
    meetingIdOrCode: string,
    hostId: string,
    format: 'csv' | 'excel',
  ) {
    const rows = await this.listRegistrations(meetingIdOrCode, hostId);
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Company',
      'Designation',
      'City',
      'State',
      'Country',
      'Website',
      'LinkedIn',
      'Registration Date',
      'Status',
      'Joined At',
    ];

    const customKeys = Array.from(
      new Set(rows.flatMap((row) => row.customAnswers.map((a) => a.label))),
    );
    const allHeaders = [...headers, ...customKeys];

    const dataRows = rows.map((row) => {
      const base = [
        row.fullName,
        row.email,
        row.phone ?? '',
        row.company ?? '',
        row.designation ?? '',
        row.city ?? '',
        row.state ?? '',
        row.country ?? '',
        row.website ?? '',
        row.linkedInUrl ?? '',
        new Date(row.createdAt).toISOString(),
        row.status,
        row.joinedAt ? new Date(row.joinedAt).toISOString() : '',
      ];
      const custom = customKeys.map(
        (label) =>
          row.customAnswers.find((a) => a.label === label)?.value ?? '',
      );
      return [...base, ...custom];
    });

    if (format === 'csv') {
      return {
        filename: 'registrations.csv',
        contentType: 'text/csv; charset=utf-8',
        body: this.toCsv(allHeaders, dataRows),
      };
    }

    return {
      filename: 'registrations.xls',
      contentType: 'application/vnd.ms-excel',
      body: this.toSpreadsheetXml(allHeaders, dataRows),
    };
  }

  async getAdminStats() {
    const [totalRegistrations, approved, joined, meetingsWithRegistration] =
      await Promise.all([
        this.prisma.meetingRegistration.count(),
        this.prisma.meetingRegistration.count({
          where: {
            status: {
              in: [RegistrationStatus.APPROVED, RegistrationStatus.JOINED],
            },
          },
        }),
        this.prisma.meetingRegistration.count({
          where: { status: RegistrationStatus.JOINED },
        }),
        this.prisma.meetingSettings.count({
          where: { registrationRequired: true },
        }),
      ]);

    const registrationConversionRate =
      totalRegistrations > 0
        ? Math.round((approved / totalRegistrations) * 1000) / 10
        : 0;
    const joinRate =
      approved > 0 ? Math.round((joined / approved) * 1000) / 10 : 0;

    return {
      totalRegistrations,
      meetingsWithRegistration,
      registrationConversionRate,
      joinRate,
    };
  }

  private validateFormPayload(dto: UpsertRegistrationFormDto) {
    const fullName = dto.fields.find(
      (f) =>
        f.standardField === StandardRegistrationField.FULL_NAME ||
        f.fieldKey === 'full_name',
    );
    const email = dto.fields.find(
      (f) =>
        f.standardField === StandardRegistrationField.EMAIL ||
        f.fieldKey === 'email',
    );

    if (!fullName?.isEnabled || !fullName.isRequired || !fullName.isLocked) {
      throw new BadRequestException(
        'Full Name is required and cannot be removed',
      );
    }
    if (!email?.isEnabled || !email.isRequired || !email.isLocked) {
      throw new BadRequestException(
        'Email Address is required and cannot be removed',
      );
    }

    const keys = new Set<string>();
    for (const field of dto.fields) {
      if (keys.has(field.fieldKey)) {
        throw new BadRequestException(`Duplicate field key: ${field.fieldKey}`);
      }
      keys.add(field.fieldKey);

      if (
        (
          [
            RegistrationFieldType.DROPDOWN,
            RegistrationFieldType.RADIO,
            RegistrationFieldType.CHECKBOX,
          ] as RegistrationFieldType[]
        ).includes(field.fieldType) &&
        (!field.options || field.options.length === 0)
      ) {
        throw new BadRequestException(
          `Options are required for ${field.label}`,
        );
      }
    }
  }

  private extractStandardValues(
    fields: Array<{
      fieldKey: string;
      standardField: StandardRegistrationField | null;
      isRequired: boolean;
      label: string;
    }>,
    answers: Record<string, string | string[]>,
    dto: SubmitRegistrationDto,
  ) {
    const values: Record<string, string> = {
      fullName: '',
      email: '',
    };

    for (const field of fields) {
      if (!field.standardField) continue;
      const column = standardFieldColumnKey(
        field.standardField as Parameters<typeof standardFieldColumnKey>[0],
      );
      if (!column) continue;

      const raw =
        answers[field.fieldKey] ??
        (column === 'fullName'
          ? dto.fullName
          : column === 'email'
            ? dto.email
            : undefined);
      const value = Array.isArray(raw)
        ? raw.join(', ')
        : String(raw ?? '').trim();

      if (field.isRequired && !value) {
        throw new BadRequestException(`${field.label} is required`);
      }

      values[column] = value;
    }

    if (!values.fullName?.trim()) {
      throw new BadRequestException('Full Name is required');
    }
    if (!values.email?.trim()) {
      throw new BadRequestException('Email Address is required');
    }

    return {
      fullName: values.fullName.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone?.trim() || null,
      city: values.city?.trim() || null,
      state: values.state?.trim() || null,
      country: values.country?.trim() || null,
      company: values.company?.trim() || null,
      designation: values.designation?.trim() || null,
      website: values.website?.trim() || null,
      linkedInUrl: values.linkedInUrl?.trim() || null,
    };
  }

  private async resolveMeeting(
    idOrCode: string,
    include?: Prisma.MeetingInclude,
  ) {
    const meeting = await this.prisma.meeting.findFirst({
      where: {
        OR: [
          { id: idOrCode },
          { meetingCode: idOrCode.toUpperCase() },
          { id: idOrCode.toUpperCase() },
        ],
      },
      include,
    });

    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }

    return meeting;
  }

  private toCsv(headers: string[], rows: string[][]) {
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    return [headers, ...rows]
      .map((row) => row.map(escape).join(','))
      .join('\n');
  }

  private toSpreadsheetXml(headers: string[], rows: string[][]) {
    const cell = (value: string) =>
      `<Cell><Data ss:Type="String">${value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>`;
    const rowXml = (cells: string[]) =>
      `<Row>${cells.map(cell).join('')}</Row>`;

    return `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Registrations">
<Table>
${rowXml(headers)}
${rows.map(rowXml).join('\n')}
</Table>
</Worksheet>
</Workbook>`;
  }
}
