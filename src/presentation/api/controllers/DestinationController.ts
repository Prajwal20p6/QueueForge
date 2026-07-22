import { Request, Response } from 'express';
import { RegisterDestinationUseCase } from '../../../application/use-cases/RegisterDestinationUseCase';
import { PrismaDestinationRepository } from '../../../infrastructure/database/PrismaDestinationRepository';
import { logger } from '../../../infrastructure/logging/logger';
import { DestinationType } from '../../../domain/value-objects/DestinationType';

export class DestinationController {
  private readonly destinationRepository = new PrismaDestinationRepository();
  private readonly registerDestinationUseCase = new RegisterDestinationUseCase(
    this.destinationRepository
  );

  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, type, config, isActive } = req.body;

      if (!name || !type || !config) {
        res.status(400).json({ error: 'Missing required parameters: name, type, config' });
        return;
      }

      if (!Object.values(DestinationType).includes(type)) {
        res.status(400).json({
          error: `Invalid destination type. Must be one of: ${Object.values(DestinationType).join(', ')}`,
        });
        return;
      }

      const destination = await this.registerDestinationUseCase.execute({
        name,
        type,
        config,
        isActive,
      });

      logger.info(`Registered new destination: ${destination.name} (${destination.id})`);
      res.status(201).json(destination);
    } catch (err: any) {
      logger.error('Failed to register destination: ', err);
      res.status(400).json({ error: err.message || 'Failed to register destination' });
    }
  };

  public list = async (req: Request, res: Response): Promise<void> => {
    try {
      const destinations = await this.destinationRepository.findAll();
      res.status(200).json(destinations);
    } catch (err: any) {
      logger.error('Failed to list destinations: ', err);
      res.status(500).json({ error: 'Failed to retrieve destinations' });
    }
  };

  public toggle = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const destination = await this.destinationRepository.findById(id);

      if (!destination) {
        res.status(404).json({ error: 'Destination not found' });
        return;
      }

      destination.isActive = !destination.isActive;
      const updated = await this.destinationRepository.update(destination);

      logger.info(`Destination ${id} status toggled to active=${updated.isActive}`);
      res.status(200).json(updated);
    } catch (err: any) {
      logger.error(`Failed to toggle destination status for ${req.params.id}: `, err);
      res.status(500).json({ error: 'Failed to update destination status' });
    }
  };
}
export const destinationController = new DestinationController();
